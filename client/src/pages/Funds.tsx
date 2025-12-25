import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { Plus, TrendingUp, Trash2, Loader2, AlertCircle } from "lucide-react";
import { useState, useCallback, useRef } from "react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";

export default function Funds() {
  const [open, setOpen] = useState(false);
  const [bankId, setBankId] = useState("");
  const [fundId, setFundId] = useState("");
  const [newFundName, setNewFundName] = useState("");
  const [newFundCode, setNewFundCode] = useState("");
  const [newFundNav, setNewFundNav] = useState("");
  const [newFundCurrency, setNewFundCurrency] = useState("");
  const [useNewFund, setUseNewFund] = useState(false);
  const [units, setUnits] = useState("");
  const [avgCost, setAvgCost] = useState("");
  const [isFetchingFundInfo, setIsFetchingFundInfo] = useState(false);
  const [fundFetchError, setFundFetchError] = useState("");
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const utils = trpc.useUtils();
  const { data: fundHoldings, isLoading } = trpc.fundHoldings.list.useQuery();
  const { data: banks } = trpc.banks.list.useQuery();
  const { data: funds } = trpc.funds.list.useQuery();
  const { data: currencies } = trpc.currencies.list.useQuery();

  const createFundMutation = trpc.funds.create.useMutation();
  const fetchFundInfoMutation = trpc.funds.fetchFundInfo.useQuery(
    { fundCode: newFundCode },
    { enabled: false }
  );
  
  const createMutation = trpc.fundHoldings.create.useMutation({
    onSuccess: () => {
      utils.fundHoldings.list.invalidate();
      utils.funds.list.invalidate();
      toast.success("基金持倉已新增");
      setOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error("新增失敗: " + error.message);
    },
  });

  const deleteMutation = trpc.fundHoldings.delete.useMutation({
    onSuccess: () => {
      utils.fundHoldings.list.invalidate();
      toast.success("基金持倉已刪除");
    },
    onError: (error) => {
      toast.error("刪除失敗: " + error.message);
    },
  });

  const resetForm = () => {
    setBankId("");
    setFundId("");
    setNewFundName("");
    setNewFundCode("");
    setNewFundNav("");
    setNewFundCurrency("");
    setUseNewFund(false);
    setUnits("");
    setAvgCost("");
    setFundFetchError("");
  };

  // 自動抓取基金資訊
  const handleFundCodeChange = useCallback(
    (code: string) => {
      setNewFundCode(code);
      setFundFetchError("");

      // 清除之前的防抖計時器
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      if (!code.trim()) {
        return;
      }

      // 設置新的防抖計時器
      debounceTimerRef.current = setTimeout(async () => {
        setIsFetchingFundInfo(true);
        try {
          const result = await fetchFundInfoMutation.refetch();
          
          if (result.data) {
            const fundInfo = result.data;
            setNewFundName(fundInfo.fundName);
            setNewFundNav(fundInfo.nav);
            
            // 自動選擇對應的幣別
            const matchingCurrency = currencies?.find(
              (c) => c.code === fundInfo.currency
            );
            if (matchingCurrency) {
              setNewFundCurrency(matchingCurrency.id.toString());
            }
            
            toast.success(`已自動填入基金資訊: ${fundInfo.fundName}`);
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "無法獲取基金資訊";
          setFundFetchError(errorMessage);
          toast.error(`抓取失敗: ${errorMessage}`);
        } finally {
          setIsFetchingFundInfo(false);
        }
      }, 800); // 800ms 防抖延遲
    },
    [currencies, fetchFundInfoMutation]
  );

  const handleCreate = async () => {
    if (!bankId || !units || !avgCost) {
      toast.error("請填寫銀行、單位數與平均成本");
      return;
    }

    let finalFundId: number | null = null;

    if (useNewFund) {
      if (!newFundName.trim() || !newFundCurrency) {
        toast.error("請填寫基金名稱與幣別");
        return;
      }
      try {
        await createFundMutation.mutateAsync({
          name: newFundName,
          code: newFundCode || undefined,
          currencyId: parseInt(newFundCurrency),
          nav: newFundNav || undefined,
        });
        // Refresh funds list and get the newly created fund
        const updatedFunds = await utils.funds.list.fetch();
        const newFund = updatedFunds.find((f) => f.name === newFundName);
        if (newFund) {
          finalFundId = newFund.id;
        }
      } catch (error) {
        toast.error("建立基金失敗");
        return;
      }
    } else {
      if (!fundId) {
        toast.error("請選擇基金");
        return;
      }
      finalFundId = parseInt(fundId);
    }

    if (!finalFundId) {
      toast.error("無法確定基金 ID");
      return;
    }

    createMutation.mutate({
      bankId: parseInt(bankId),
      fundId: finalFundId,
      units,
      avgCost,
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("確定要刪除此基金持倉嗎？")) {
      deleteMutation.mutate({ id });
    }
  };

  const getFundName = (fundId: number) => {
    return funds?.find((f) => f.id === fundId)?.name || "未知基金";
  };

  const getBankName = (bankId: number) => {
    return banks?.find((b) => b.id === bankId)?.name || "未知銀行";
  };

  const getCurrencySymbol = (currencyId: number) => {
    return currencies?.find((c) => c.id === currencyId)?.symbol || "";
  };

  const calculateValue = (units: string, nav: string | null) => {
    if (!nav) return 0;
    return parseFloat(units) * parseFloat(nav);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">基金持倉管理</h1>
            <p className="text-muted-foreground mt-2">
              管理您的基金投資組合與淨值追蹤
            </p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                新增持倉
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>新增基金持倉</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="bank">銀行 *</Label>
                  <Select value={bankId} onValueChange={setBankId}>
                    <SelectTrigger>
                      <SelectValue placeholder="選擇銀行" />
                    </SelectTrigger>
                    <SelectContent>
                      {banks?.map((bank) => (
                        <SelectItem key={bank.id} value={bank.id.toString()}>
                          {bank.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>基金選擇 *</Label>
                  <Tabs
                    value={useNewFund ? "new" : "existing"}
                    onValueChange={(value) => setUseNewFund(value === "new")}
                  >
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="existing">現有基金</TabsTrigger>
                      <TabsTrigger value="new">新增基金</TabsTrigger>
                    </TabsList>

                    <TabsContent value="existing" className="space-y-2">
                      <Label htmlFor="fund">基金 *</Label>
                      <Select value={fundId} onValueChange={setFundId}>
                        <SelectTrigger>
                          <SelectValue placeholder="選擇基金" />
                        </SelectTrigger>
                        <SelectContent>
                          {funds?.map((fund) => (
                            <SelectItem key={fund.id} value={fund.id.toString()}>
                              {fund.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TabsContent>

                    <TabsContent value="new" className="space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor="newFundCode">基金代碼 *</Label>
                        <div className="flex gap-2">
                          <Input
                            id="newFundCode"
                            placeholder="例如: FTS049"
                            value={newFundCode}
                            onChange={(e) => handleFundCodeChange(e.target.value)}
                            disabled={isFetchingFundInfo}
                          />
                          {isFetchingFundInfo && (
                            <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
                          )}
                        </div>
                        {fundFetchError && (
                          <div className="flex items-center gap-2 text-sm text-destructive">
                            <AlertCircle className="h-4 w-4" />
                            <span>{fundFetchError}</span>
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground">
                          輸入基富通基金代碼，系統將自動抓取基金名稱與淨值
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="newFundName">基金名稱 *</Label>
                        <Input
                          id="newFundName"
                          placeholder="例如: 元大台灣50"
                          value={newFundName}
                          onChange={(e) => setNewFundName(e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="newFundCurrency">幣別 *</Label>
                        <Select value={newFundCurrency} onValueChange={setNewFundCurrency}>
                          <SelectTrigger>
                            <SelectValue placeholder="選擇幣別" />
                          </SelectTrigger>
                          <SelectContent>
                            {currencies?.map((currency) => (
                              <SelectItem key={currency.id} value={currency.id.toString()}>
                                {currency.symbol} {currency.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="newFundNav">淨值</Label>
                        <Input
                          id="newFundNav"
                          type="number"
                          step="0.000001"
                          placeholder="例如: 15.25"
                          value={newFundNav}
                          onChange={(e) => setNewFundNav(e.target.value)}
                          disabled={isFetchingFundInfo}
                        />
                        <p className="text-xs text-muted-foreground">
                          自動抓取或手動輸入淨值
                        </p>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="units">單位數 *</Label>
                  <Input
                    id="units"
                    type="number"
                    step="0.000001"
                    placeholder="例如: 1000.5"
                    value={units}
                    onChange={(e) => setUnits(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="avgCost">平均成本 *</Label>
                  <Input
                    id="avgCost"
                    type="number"
                    step="0.000001"
                    placeholder="例如: 15.00"
                    value={avgCost}
                    onChange={(e) => setAvgCost(e.target.value)}
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={handleCreate}
                    disabled={createMutation.isPending}
                    className="flex-1"
                  >
                    {createMutation.isPending ? "新增中..." : "新增持倉"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setOpen(false);
                      resetForm();
                    }}
                    className="flex-1"
                  >
                    取消
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Holdings List */}
        <Card>
          <CardHeader>
            <CardTitle>持倉清單</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-muted-foreground">載入中...</p>
            ) : fundHoldings && fundHoldings.length > 0 ? (
              <div className="space-y-4">
                {fundHoldings.map((holding) => (
                  <div
                    key={holding.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex-1">
                      <h3 className="font-semibold">{getFundName(holding.fundId)}</h3>
                      <p className="text-sm text-muted-foreground">
                        {getBankName(holding.bankId)} • 單位數: {holding.units}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        平均成本: {getCurrencySymbol(
                          funds?.find((f) => f.id === holding.fundId)?.currencyId || 0
                        )}
                        {holding.avgCost}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(holding.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                尚無基金持倉，點擊「新增持倉」開始記錄
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
