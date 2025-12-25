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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { trpc } from "@/lib/trpc";
import { Shield, ShieldAlert, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function AdminUsers() {
  const [editOpen, setEditOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedRole, setSelectedRole] = useState<"user" | "admin">("user");
  const [selectedActive, setSelectedActive] = useState(true);

  const utils = trpc.useUtils();
  const { data: users, isLoading } = trpc.users.list.useQuery();

  const updateMutation = trpc.users.update.useMutation({
    onSuccess: () => {
      utils.users.list.invalidate();
      toast.success("使用者資訊已更新");
      setEditOpen(false);
    },
    onError: (error) => {
      toast.error("更新失敗: " + error.message);
    },
  });

  const handleEdit = (userId: number, role: "user" | "admin", isActive: boolean) => {
    setSelectedUserId(userId);
    setSelectedRole(role);
    setSelectedActive(isActive);
    setEditOpen(true);
  };

  const handleUpdate = () => {
    if (!selectedUserId) return;
    updateMutation.mutate({
      id: selectedUserId,
      role: selectedRole,
      isActive: selectedActive,
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">使用者管理</h1>
          <p className="text-muted-foreground mt-2">
            管理系統使用者的角色與權限設定
          </p>
        </div>

        {/* Users List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
              <p className="text-muted-foreground">載入中...</p>
            </div>
          </div>
        ) : users && users.length > 0 ? (
          <div className="grid gap-4">
            {users.map((user) => (
              <Card key={user.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div
                      className={`p-2 rounded-lg ${
                        user.role === "admin" ? "bg-red-50" : "bg-blue-50"
                      }`}
                    >
                      {user.role === "admin" ? (
                        <ShieldAlert className="h-5 w-5 text-red-600" />
                      ) : (
                        <Shield className="h-5 w-5 text-blue-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg flex items-center gap-2">
                        {user.name || "未命名使用者"}
                        {!user.isActive && (
                          <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">
                            已停用
                          </span>
                        )}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground truncate">
                        {user.email || "無電子郵件"}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(user.id, user.role, user.isActive)}
                  >
                    編輯
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">角色</p>
                      <p className="font-medium mt-1">
                        {user.role === "admin" ? "管理員" : "一般使用者"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">狀態</p>
                      <p className="font-medium mt-1">
                        {user.isActive ? "啟用" : "停用"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">登入方式</p>
                      <p className="font-medium mt-1">
                        {user.loginMethod || "未知"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">最後登入</p>
                      <p className="font-medium mt-1">
                        {new Date(user.lastSignedIn).toLocaleDateString()}
                      </p>
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
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">尚無使用者</h3>
                <p className="text-muted-foreground">
                  系統中還沒有註冊的使用者
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Edit Dialog */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>編輯使用者</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="role">角色</Label>
                <Select
                  value={selectedRole}
                  onValueChange={(v) => setSelectedRole(v as "user" | "admin")}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">一般使用者</SelectItem>
                    <SelectItem value="admin">管理員</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="active">啟用狀態</Label>
                <Switch
                  id="active"
                  checked={selectedActive}
                  onCheckedChange={setSelectedActive}
                />
              </div>
              <Button
                className="w-full"
                onClick={handleUpdate}
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? "更新中..." : "確認更新"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Info Card */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <p className="text-sm text-blue-900">
              <strong>提示：</strong>
              使用者首次登入時會自動建立帳號。系統擁有者會自動設定為管理員角色。
              管理員可以修改其他使用者的角色與啟用狀態。
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
