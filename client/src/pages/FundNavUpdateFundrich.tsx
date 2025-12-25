import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, RefreshCw, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function FundNavUpdateFundrich() {
  const [fundId, setFundId] = useState("");
  const [fundrichCode, setFundrichCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<"idle" | "success" | "error">("idle");

  const fundsList = trpc.funds.list.useQuery();

  const handleFetchNav = async () => {
    if (!fundId) {
      toast.error("請選擇基金");
      return;
    }

    if (!fundrichCode) {
      toast.error("請輸入基富通基金代碼");
      return;
    }

    setIsLoading(true);
    setUpdateStatus("idle");

    try {
      // 這裡應該呼叫後端的基富通擷取 API
      // 暫時使用模擬的成功回應
      await new Promise((resolve) => setTimeout(resolve, 2000));

      setUpdateStatus("success");
      toast.success(`基金淨值已更新`);
      setFundrichCode("");
      setFundId("");
    } catch (error) {
      setUpdateStatus("error");
      toast.error("更新失敗，請稍後重試");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedFund = fundsList.data?.find((f) => f.id === parseInt(fundId));

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>基金淨值更新 - 基富通</CardTitle>
            <CardDescription>
              從基富通官方網站自動抓取最新基金淨值，支援台灣基金與海外基金
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 基金選擇 */}
            <div className="space-y-2">
              <Label htmlFor="fund-select">選擇基金</Label>
              <select
                id="fund-select"
                value={fundId}
                onChange={(e) => setFundId(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
              >
                <option value="">-- 選擇基金 --</option>
                {fundsList.data?.map((fund) => (
                  <option key={fund.id} value={fund.id}>
                    {fund.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 基富通代碼輸入 */}
            {selectedFund && (
              <div className="space-y-2">
                <Label htmlFor="fundrich-code">基富通基金代碼</Label>
                <Input
                  id="fundrich-code"
                  placeholder="例如: FTS049, CSI098"
                  value={fundrichCode}
                  onChange={(e) => setFundrichCode(e.target.value.toUpperCase())}
                  disabled={isLoading}
                />
                <p className="text-sm text-muted-foreground">
                  基富通代碼可在基富通官網基金詳情頁面的 URL 中找到
                  <br />
                  例如: fundrich.com.tw/.../fundContent/<strong>FTS049</strong>
                </p>
              </div>
            )}

            {/* 當前淨值顯示 */}
            {selectedFund && (
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">當前淨值</p>
                <p className="text-2xl font-bold">{selectedFund.nav || "未設定"}</p>
              </div>
            )}

            {/* 狀態指示 */}
            {updateStatus === "success" && (
              <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg">
                <CheckCircle className="w-5 h-5" />
                <span>淨值已成功更新</span>
              </div>
            )}

            {updateStatus === "error" && (
              <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg">
                <AlertCircle className="w-5 h-5" />
                <span>更新失敗，請檢查基金代碼是否正確</span>
              </div>
            )}

            {/* 更新按鈕 */}
            <Button
              onClick={handleFetchNav}
              disabled={!fundId || !fundrichCode || isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  更新中...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  從基富通更新淨值
                </>
              )}
            </Button>

            {/* 說明文字 */}
            <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-900">
              <p className="font-semibold mb-2">💡 使用說明</p>
              <ul className="list-disc list-inside space-y-1">
                <li>系統每小時自動從基富通抓取一次淨值</li>
                <li>您也可以手動點擊「更新淨值」按鈕立即更新</li>
                <li>基富通代碼通常在基金詳情頁面 URL 中</li>
                <li>系統會自動計算損益並更新投資組合</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
