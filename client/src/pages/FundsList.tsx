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
import { Plus, Trash2, TrendingUp } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function FundsList() {
  const [open, setOpen] = useState(false);
  const [fundName, setFundName] = useState("");
  const [fundCode, setFundCode] = useState("");
  const [currencyId, setCurrencyId] = useState("");
  const [nav, setNav] = useState("");

  const utils = trpc.useUtils();
  const { data: funds, isLoading } = trpc.funds.list.useQuery();
  const { data: currencies } = trpc.currencies.list.useQuery();

  const createMutation = trpc.funds.create.useMutation({
    onSuccess: () => {
      utils.funds.list.invalidate();
      toast.success("基金已新增");
      setOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error("新增失敗: " + error.message);
    },
  });

  const deleteMutation = trpc.funds.delete.useMutation({
    onSuccess: () => {
      utils.funds.list.invalidate();
      toast.success("基金已刪除");
    },
    onError: (error) => {
      toast.error("刪除失敗: " + error.message);
    },
  });

  const resetForm = () => {
    setFundName("");
    setFundCode("");
    setCurrencyId("");
    setNav("");
  };

  const handleCreate = () => {
    if (!fundName.trim() || !currencyId) {
      toast.error("請填寫基金名稱與幣別");
      return;
    }
    createMutation.mutate({
      name: fundName,
      code: fundCode || undefined,
      currencyId: parseInt(currencyId),
      nav: nav || undefined,
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("確定要刪除此基金嗎？相關持倉記錄將保留。")) {
      deleteMutation.mutate({ id });
    }
  };

  const getCurrencySymbol = (currencyId: number) => {
    return currencies?.find((c) => c.id === currencyId)?.symbol || "";
  };

  const getCurrencyName = (currencyId: number) => {
    return currencies?.find((c) => c.id === currencyId)?.name || "";
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">基金清單管理</h1>
            <p className="text-muted-foreground mt-2">
              建立與管理您的基金資料庫
            </p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                新增基金
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>新增基金</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="fundName">基金名稱 *</Label>
                  <Input
                    id="fundName"
                    placeholder="例如: 元大台灣50"
                    value={fundName}
                    onChange={(e) => setFundName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fundCode">基金代碼 (選填)</Label>
                  <Input
                    id="fundCode"
                    placeholder="例如: 0050"
                    value={fundCode}
                    onChange={(e) => setFundCode(e.target.value)}
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
                <div className="space-y-2">
                  <Label htmlFor="nav">淨值 (選填)</Label>
                  <Input
                    id="nav"
                    type="number"
                    step="0.000001"
                    placeholder="例如: 15.25"
                    value={nav}
                    onChange={(e) => setNav(e.target.value)}
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

        {/* Funds List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
              <p className="text-muted-foreground">載入中...</p>
            </div>
          </div>
        ) : funds && funds.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {funds.map((fund) => (
              <Card key={fund.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="p-2 rounded-lg bg-green-50 flex-shrink-0">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate">
                        {fund.name}
                      </CardTitle>
                      {fund.code && (
                        <p className="text-sm text-muted-foreground">
                          代碼: {fund.code}
                        </p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(fund.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">幣別</span>
                      <span className="font-medium">
                        {getCurrencySymbol(fund.currencyId)}{" "}
                        {getCurrencyName(fund.currencyId)}
                      </span>
                    </div>
                    {fund.nav && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">淨值</span>
                        <span className="font-medium">
                          {getCurrencySymbol(fund.currencyId)}{" "}
                          {parseFloat(fund.nav).toFixed(4)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>更新時間</span>
                      <span>{new Date(fund.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">尚無基金資料</h3>
                <p className="text-muted-foreground mb-4">
                  點擊右上角「新增基金」按鈕開始建立基金清單
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Info Card */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <p className="text-sm text-blue-900">
              <strong>提示：</strong>
              在此頁面建立基金後，您就可以在「基金持倉」頁面選擇這些基金來記錄您的持倉情況。
              每個基金可以關聯多筆持倉記錄。
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
