import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, RefreshCw, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function FundNavUpdate() {
  const [fundId, setFundId] = useState("");
  const [fundCode, setFundCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<"idle" | "success" | "error">("idle");

  const fundsList = trpc.funds.list.useQuery();
  const fetchNavMutation = trpc.funds.fetchNav.useMutation();

  const handleFetchNav = async () => {
    if (!fundId) {
      toast.error("請選擇基金");
      return;
    }

    setIsLoading(true);
    setUpdateStatus("idle");

    try {
      const result = await fetchNavMutation.mutateAsync({
        id: parseInt(fundId),
        fundCode: fundCode || undefined,
      });

      setUpdateStatus("success");
      toast.success(`基金淨值已更新: ${result.nav}`);
      setFundCode("");
      setFundId("");
    } catch (error) {
      setUpdateStatus("error");
      toast.error("更新失敗，請稍後重試");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedFund = fundsList.data?.find(
    (f) => f.id === parseInt(fundId)
  );

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>基金淨值更新</CardTitle>
            <CardDescription>
              從外部 API 自動獲取最新基金淨值，支援美股 ETF 與台灣基金
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
                    {fund.name} {fund.code ? `(${fund.code})` : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* 基金代碼輸入 */}
            {selectedFund && (
              <div className="space-y-2">
                <Label htmlFor="fund-code">基金代碼</Label>
                <Input
                  id="fund-code"
                  placeholder={selectedFund.code || "輸入基金代碼 (如: AAPL 或 001001)"}
                  value={fundCode}
                  onChange={(e) => setFundCode(e.target.value)}
                  disabled={isLoading}
                />
                <p className="text-sm text-muted-foreground">
                  美股 ETF: 1-5 個字母 (如 AAPL, VTI)
                  <br />
                  台灣基金: 6 位數字 (如 001001)
                </p>
              </div>
            )}

            {/* 當前淨值顯示 */}
            {selectedFund && (
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">當前淨值</p>
                <p className="text-2xl font-bold">{selectedFund.nav}</p>
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
              disabled={!fundId || isLoading}
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
                  更新淨值
                </>
              )}
            </Button>

            {/* 說明文字 */}
            <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-900">
              <p className="font-semibold mb-2">💡 使用說明</p>
              <ul className="list-disc list-inside space-y-1">
                <li>系統支援美股 ETF 與台灣基金淨值查詢</li>
                <li>美股代碼需在 Alpha Vantage 中有效</li>
                <li>台灣基金代碼需符合 6 位數字格式</li>
                <li>更新可能需要 5-10 秒，請耐心等待</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
