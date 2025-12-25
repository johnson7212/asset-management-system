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
import { trpc } from "@/lib/trpc";
import { Plus, Trash2, Wallet } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Banks() {
  const [open, setOpen] = useState(false);
  const [bankName, setBankName] = useState("");
  const [bankCode, setBankCode] = useState("");

  const utils = trpc.useUtils();
  const { data: banks, isLoading } = trpc.banks.list.useQuery();
  const createMutation = trpc.banks.create.useMutation({
    onSuccess: () => {
      utils.banks.list.invalidate();
      toast.success("銀行帳戶已新增");
      setOpen(false);
      setBankName("");
      setBankCode("");
    },
    onError: (error) => {
      toast.error("新增失敗: " + error.message);
    },
  });
  const deleteMutation = trpc.banks.delete.useMutation({
    onSuccess: () => {
      utils.banks.list.invalidate();
      toast.success("銀行帳戶已刪除");
    },
    onError: (error) => {
      toast.error("刪除失敗: " + error.message);
    },
  });

  const handleCreate = () => {
    if (!bankName.trim()) {
      toast.error("請輸入銀行名稱");
      return;
    }
    createMutation.mutate({ name: bankName, code: bankCode || undefined });
  };

  const handleDelete = (id: number) => {
    if (confirm("確定要刪除此銀行帳戶嗎？")) {
      deleteMutation.mutate({ id });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">銀行帳戶管理</h1>
            <p className="text-muted-foreground mt-2">
              管理您的銀行帳戶與多幣別存款
            </p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                新增銀行
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>新增銀行帳戶</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="bankName">銀行名稱 *</Label>
                  <Input
                    id="bankName"
                    placeholder="例如: 玉山銀行"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bankCode">銀行代碼 (選填)</Label>
                  <Input
                    id="bankCode"
                    placeholder="例如: 808"
                    value={bankCode}
                    onChange={(e) => setBankCode(e.target.value)}
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

        {/* Banks List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
              <p className="text-muted-foreground">載入中...</p>
            </div>
          </div>
        ) : banks && banks.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {banks.map((bank) => (
              <Card key={bank.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-50">
                      <Wallet className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{bank.name}</CardTitle>
                      {bank.code && (
                        <p className="text-sm text-muted-foreground mt-1">
                          代碼: {bank.code}
                        </p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(bank.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    建立時間: {new Date(bank.createdAt).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <Wallet className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">尚無銀行帳戶</h3>
                <p className="text-muted-foreground mb-4">
                  點擊右上角「新增銀行」按鈕開始建立您的第一個銀行帳戶
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
