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
import { Bitcoin, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const EXCHANGES = [
  "Binance",
  "Bybit",
  "OKX",
  "Crypto.com",
  "gate",
  "MAX",
  "幣託",
];

export default function Crypto() {
  const [open, setOpen] = useState(false);
  const [exchange, setExchange] = useState("");
  const [symbol, setSymbol] = useState("");
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [stakedAmount, setStakedAmount] = useState("");
  const [avgCost, setAvgCost] = useState("");

  const utils = trpc.useUtils();
  const { data: cryptoHoldings, isLoading } = trpc.cryptoHoldings.list.useQuery();

  const createMutation = trpc.cryptoHoldings.create.useMutation({
    onSuccess: () => {
      utils.cryptoHoldings.list.invalidate();
      toast.success("虛擬資產已新增");
      setOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error("新增失敗: " + error.message);
    },
  });

  const deleteMutation = trpc.cryptoHoldings.delete.useMutation({
    onSuccess: () => {
      utils.cryptoHoldings.list.invalidate();
      toast.success("虛擬資產已刪除");
    },
    onError: (error) => {
      toast.error("刪除失敗: " + error.message);
    },
  });

  const resetForm = () => {
    setExchange("");
    setSymbol("");
    setName("");
    setAmount("");
    setStakedAmount("");
    setAvgCost("");
  };

  const handleCreate = () => {
    if (!exchange || !symbol || !amount) {
      toast.error("請填寫所有必填欄位");
      return;
    }
    createMutation.mutate({
      exchange,
      symbol,
      name: name || undefined,
      amount,
      stakedAmount: stakedAmount || undefined,
      avgCost: avgCost || undefined,
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("確定要刪除此虛擬資產嗎？")) {
      deleteMutation.mutate({ id });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">虛擬資產管理</h1>
            <p className="text-muted-foreground mt-2">
              管理您在各交易所的虛擬貨幣持倉與質押
            </p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                新增資產
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>新增虛擬資產</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="exchange">交易所 *</Label>
                  <Select value={exchange} onValueChange={setExchange}>
                    <SelectTrigger>
                      <SelectValue placeholder="選擇交易所" />
                    </SelectTrigger>
                    <SelectContent>
                      {EXCHANGES.map((ex) => (
                        <SelectItem key={ex} value={ex}>
                          {ex}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="symbol">幣種代碼 *</Label>
                  <Input
                    id="symbol"
                    placeholder="例如: BTC, ETH, USDT"
                    value={symbol}
                    onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">幣種名稱 (選填)</Label>
                  <Input
                    id="name"
                    placeholder="例如: Bitcoin"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount">持有數量 *</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.0000000001"
                    placeholder="例如: 0.5"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stakedAmount">質押數量 (選填)</Label>
                  <Input
                    id="stakedAmount"
                    type="number"
                    step="0.0000000001"
                    placeholder="例如: 0.1"
                    value={stakedAmount}
                    onChange={(e) => setStakedAmount(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="avgCost">平均成本 TWD (選填)</Label>
                  <Input
                    id="avgCost"
                    type="number"
                    step="0.000001"
                    placeholder="例如: 1500000"
                    value={avgCost}
                    onChange={(e) => setAvgCost(e.target.value)}
                  />
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
        ) : cryptoHoldings && cryptoHoldings.length > 0 ? (
          <div className="grid gap-4">
            {cryptoHoldings.map((holding) => {
              const totalAmount = parseFloat(holding.amount);
              const staked = holding.stakedAmount
                ? parseFloat(holding.stakedAmount)
                : 0;
              const available = totalAmount - staked;

              return (
                <Card
                  key={holding.id}
                  className="hover:shadow-lg transition-shadow"
                >
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="p-2 rounded-lg bg-orange-50 flex-shrink-0">
                        <Bitcoin className="h-5 w-5 text-orange-600" />
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
                          {holding.exchange}
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
                        <p className="text-xs text-muted-foreground">總持有</p>
                        <p className="text-sm font-medium mt-1">
                          {totalAmount.toFixed(8)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">可用</p>
                        <p className="text-sm font-medium mt-1">
                          {available.toFixed(8)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">質押中</p>
                        <p className="text-sm font-medium mt-1">
                          {staked.toFixed(8)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">平均成本</p>
                        <p className="text-sm font-medium mt-1">
                          {holding.avgCost
                            ? `NT$ ${parseFloat(holding.avgCost).toFixed(2)}`
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
                <Bitcoin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">尚無虛擬資產</h3>
                <p className="text-muted-foreground mb-4">
                  點擊右上角「新增資產」按鈕開始記錄您的虛擬貨幣投資
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
