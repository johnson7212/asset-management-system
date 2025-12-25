import DashboardLayout from "@/components/DashboardLayout";
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
import { Plus, TrendingUp, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

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

  const utils = trpc.useUtils();
  const { data: fundHoldings, isLoading } = trpc.fundHoldings.list.useQuery();
  const { data: banks } = trpc.banks.list.useQuery();
  const { data: funds } = trpc.funds.list.useQuery();
  const { data: currencies } = trpc.currencies.list.useQuery();

  const createFundMutation = trpc.funds.create.useMutation();
  
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
  };

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

                {/* Tabs for Fund Selection */}
                <Tabs value={useNewFund ? "new" : "existing"} onValueChange={(v) => setUseNewFund(v === "new")}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="existing">選擇基金</TabsTrigger>
                    <TabsTrigger value="new">新建基金</TabsTrigger>
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
                      <Label htmlFor="newFundName">基金名稱 *</Label>
                      <Input
                        id="newFundName"
                        placeholder="例如: 元大台灣50"
                        value={newFundName}
                        onChange={(e) => setNewFundName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newFundCode">基金代碼 (選填)</Label>
                      <Input
                        id="newFundCode"
                        placeholder="例如: 0050"
                        value={newFundCode}
                        onChange={(e) => setNewFundCode(e.target.value)}
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
                      <Label htmlFor="newFundNav">淨值 (選填)</Label>
                      <Input
                        id="newFundNav"
                        type="number"
                        step="0.000001"
                        placeholder="例如: 15.25"
                        value={newFundNav}
                        onChange={(e) => setNewFundNav(e.target.value)}
                      />
                    </div>
                  </TabsContent>
                </Tabs>

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
                    placeholder="例如: 10.5"
                    value={avgCost}
                    onChange={(e) => setAvgCost(e.target.value)}
                  />
                </div>
                <Button
                  className="w-full"
                  onClick={handleCreate}
                  disabled={createMutation.isPending || createFundMutation.isPending}
                >
                  {createMutation.isPending || createFundMutation.isPending ? "新增中..." : "確認新增"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Holdings List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
              <p className="text-muted-foreground">載入中...</p>
            </div>
          </div>
        ) : fundHoldings && fundHoldings.length > 0 ? (
          <div className="grid gap-4">
            {fundHoldings.map((holding) => {
              const fund = funds?.find((f) => f.id === holding.fundId);
              const value = fund?.nav
                ? calculateValue(holding.units, fund.nav)
                : 0;
              const cost = parseFloat(holding.units) * parseFloat(holding.avgCost);
              const profit = value - cost;
              const profitPercent = cost > 0 ? (profit / cost) * 100 : 0;

              return (
                <Card key={holding.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="p-2 rounded-lg bg-green-50 flex-shrink-0">
                        <TrendingUp className="h-5 w-5 text-green-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg truncate">
                          {getFundName(holding.fundId)}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {getBankName(holding.bankId)}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(holding.id)}
                      disabled={deleteMutation.isPending}
                      className="flex-shrink-0"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground">單位數</p>
                        <p className="text-sm font-medium mt-1">
                          {parseFloat(holding.units).toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">平均成本</p>
                        <p className="text-sm font-medium mt-1">
                          {fund && getCurrencySymbol(fund.currencyId)}{" "}
                          {parseFloat(holding.avgCost).toFixed(4)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">現值</p>
                        <p className="text-sm font-medium mt-1">
                          {fund && getCurrencySymbol(fund.currencyId)}{" "}
                          {value.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">損益</p>
                        <p
                          className={`text-sm font-medium mt-1 ${
                            profit >= 0 ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {profit >= 0 ? "+" : ""}
                          {profit.toFixed(2)} ({profitPercent.toFixed(2)}%)
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">尚無基金持倉</h3>
                <p className="text-muted-foreground mb-4">
                  點擊右上角「新增持倉」按鈕開始記錄您的基金投資
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
