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
import { trpc } from "@/lib/trpc";
import { PieChart, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Stocks() {
  const [open, setOpen] = useState(false);
  const [bankId, setBankId] = useState("");
  const [symbol, setSymbol] = useState("");
  const [name, setName] = useState("");
  const [shares, setShares] = useState("");
  const [avgCost, setAvgCost] = useState("");
  const [currencyId, setCurrencyId] = useState("");
  const [marketType, setMarketType] = useState<"US" | "TW">("US");

  const utils = trpc.useUtils();
  const { data: stockHoldings, isLoading } = trpc.stockHoldings.list.useQuery();
  const { data: banks } = trpc.banks.list.useQuery();
  const { data: currencies } = trpc.currencies.list.useQuery();

  const createMutation = trpc.stockHoldings.create.useMutation({
    onSuccess: () => {
      utils.stockHoldings.list.invalidate();
      toast.success("股票持倉已新增");
      setOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error("新增失敗: " + error.message);
    },
  });

  const deleteMutation = trpc.stockHoldings.delete.useMutation({
    onSuccess: () => {
      utils.stockHoldings.list.invalidate();
      toast.success("股票持倉已刪除");
    },
    onError: (error) => {
      toast.error("刪除失敗: " + error.message);
    },
  });

  const resetForm = () => {
    setBankId("");
    setSymbol("");
    setName("");
    setShares("");
    setAvgCost("");
    setCurrencyId("");
    setMarketType("US");
  };

  const handleCreate = () => {
    if (!bankId || !symbol || !shares || !avgCost || !currencyId) {
      toast.error("請填寫所有必填欄位");
      return;
    }
    createMutation.mutate({
      bankId: parseInt(bankId),
      symbol,
      name: name || undefined,
      shares,
      avgCost,
      currencyId: parseInt(currencyId),
      marketType,
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("確定要刪除此股票持倉嗎？")) {
      deleteMutation.mutate({ id });
    }
  };

  const getBankName = (bankId: number) => {
    return banks?.find((b) => b.id === bankId)?.name || "未知銀行";
  };

  const getCurrencySymbol = (currencyId: number) => {
    return currencies?.find((c) => c.id === currencyId)?.symbol || "";
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">股票持倉管理</h1>
            <p className="text-muted-foreground mt-2">
              管理您的美股與台股投資組合
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
                <DialogTitle>新增股票持倉</DialogTitle>
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
                  <Label htmlFor="marketType">市場類型 *</Label>
                  <Select
                    value={marketType}
                    onValueChange={(v) => setMarketType(v as "US" | "TW")}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="US">美股</SelectItem>
                      <SelectItem value="TW">台股</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="symbol">股票代碼 *</Label>
                  <Input
                    id="symbol"
                    placeholder="例如: AAPL 或 2330.TW"
                    value={symbol}
                    onChange={(e) => setSymbol(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">股票名稱 (選填)</Label>
                  <Input
                    id="name"
                    placeholder="例如: Apple Inc."
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shares">股數 *</Label>
                  <Input
                    id="shares"
                    type="number"
                    step="0.000001"
                    placeholder="例如: 100"
                    value={shares}
                    onChange={(e) => setShares(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="avgCost">平均成本 *</Label>
                  <Input
                    id="avgCost"
                    type="number"
                    step="0.000001"
                    placeholder="例如: 150.50"
                    value={avgCost}
                    onChange={(e) => setAvgCost(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">幣別 *</Label>
                  <Select value={currencyId} onValueChange={setCurrencyId}>
                    <SelectTrigger>
                      <SelectValue placeholder="選擇幣別" />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies?.map((currency) => (
                        <SelectItem
                          key={currency.id}
                          value={currency.id.toString()}
                        >
                          {currency.symbol} {currency.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  className="w-full"
                  onClick={handleCreate}
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? "新增中..." : "確認新增"}
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
        ) : stockHoldings && stockHoldings.length > 0 ? (
          <div className="grid gap-4">
            {stockHoldings.map((holding) => {
              const totalCost =
                parseFloat(holding.shares) * parseFloat(holding.avgCost);

              return (
                <Card
                  key={holding.id}
                  className="hover:shadow-lg transition-shadow"
                >
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="p-2 rounded-lg bg-purple-50 flex-shrink-0">
                        <PieChart className="h-5 w-5 text-purple-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg">
                          {holding.symbol}
                          {holding.name && (
                            <span className="text-sm font-normal text-muted-foreground ml-2">
                              {holding.name}
                            </span>
                          )}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {getBankName(holding.bankId)} •{" "}
                          {holding.marketType === "US" ? "美股" : "台股"}
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
                        <p className="text-xs text-muted-foreground">股數</p>
                        <p className="text-sm font-medium mt-1">
                          {parseFloat(holding.shares).toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">平均成本</p>
                        <p className="text-sm font-medium mt-1">
                          {getCurrencySymbol(holding.currencyId)}{" "}
                          {parseFloat(holding.avgCost).toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">總成本</p>
                        <p className="text-sm font-medium mt-1">
                          {getCurrencySymbol(holding.currencyId)}{" "}
                          {totalCost.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">購買日期</p>
                        <p className="text-sm font-medium mt-1">
                          {holding.purchaseDate
                            ? new Date(holding.purchaseDate).toLocaleDateString()
                            : "未記錄"}
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
                <PieChart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">尚無股票持倉</h3>
                <p className="text-muted-foreground mb-4">
                  點擊右上角「新增持倉」按鈕開始記錄您的股票投資
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
