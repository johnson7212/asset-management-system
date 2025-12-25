import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { DollarSign, TrendingDown, TrendingUp } from "lucide-react";

export default function Analysis() {
  const { data: fundHoldings } = trpc.fundHoldings.list.useQuery();
  const { data: stockHoldings } = trpc.stockHoldings.list.useQuery();
  const { data: cryptoHoldings } = trpc.cryptoHoldings.list.useQuery();
  const { data: funds } = trpc.funds.list.useQuery();
  const { data: currencies } = trpc.currencies.list.useQuery();

  // Calculate fund profit/loss
  const fundAnalysis = fundHoldings?.map((holding) => {
    const fund = funds?.find((f) => f.id === holding.fundId);
    const currency = currencies?.find((c) => c.id === fund?.currencyId);
    
    if (!fund?.nav) return null;
    
    const units = parseFloat(holding.units);
    const avgCost = parseFloat(holding.avgCost);
    const nav = parseFloat(fund.nav);
    const exchangeRate = currency ? parseFloat(currency.exchangeRate) : 1;
    
    const currentValue = units * nav;
    const cost = units * avgCost;
    const profit = currentValue - cost;
    const profitPercent = cost > 0 ? (profit / cost) * 100 : 0;
    const twdValue = currentValue * exchangeRate;
    const twdCost = cost * exchangeRate;
    const twdProfit = twdValue - twdCost;
    
    return {
      name: fund.name,
      type: "基金",
      currentValue: twdValue,
      cost: twdCost,
      profit: twdProfit,
      profitPercent,
      currency: currency?.code || "TWD",
    };
  }).filter(Boolean);

  // Calculate stock profit/loss (simplified - needs real-time price API)
  const stockAnalysis = stockHoldings?.map((holding) => {
    const currency = currencies?.find((c) => c.id === holding.currencyId);
    const exchangeRate = currency ? parseFloat(currency.exchangeRate) : 1;
    
    const shares = parseFloat(holding.shares);
    const avgCost = parseFloat(holding.avgCost);
    const cost = shares * avgCost;
    const twdCost = cost * exchangeRate;
    
    return {
      name: `${holding.symbol}${holding.name ? ` (${holding.name})` : ""}`,
      type: "股票",
      currentValue: twdCost, // Placeholder - needs real price
      cost: twdCost,
      profit: 0, // Placeholder
      profitPercent: 0,
      currency: currency?.code || "TWD",
    };
  });

  const allAssets = [...(fundAnalysis || []), ...(stockAnalysis || [])];
  
  const totalValue = allAssets.reduce((sum, asset) => sum + (asset?.currentValue || 0), 0);
  const totalCost = allAssets.reduce((sum, asset) => sum + (asset?.cost || 0), 0);
  const totalProfit = totalValue - totalCost;
  const totalProfitPercent = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">損益分析</h1>
          <p className="text-muted-foreground mt-2">
            查看您的投資組合績效與損益統計
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                總資產價值
              </CardTitle>
              <DollarSign className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                NT$ {totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                包含基金與股票持倉
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                總成本
              </CardTitle>
              <DollarSign className="h-5 w-5 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                NT$ {totalCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                累計投入金額
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                總損益
              </CardTitle>
              {totalProfit >= 0 ? (
                <TrendingUp className="h-5 w-5 text-green-600" />
              ) : (
                <TrendingDown className="h-5 w-5 text-red-600" />
              )}
            </CardHeader>
            <CardContent>
              <div
                className={`text-3xl font-bold ${
                  totalProfit >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {totalProfit >= 0 ? "+" : ""}
                NT$ {totalProfit.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
              <p
                className={`text-sm mt-2 ${
                  totalProfit >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {totalProfitPercent >= 0 ? "+" : ""}
                {totalProfitPercent.toFixed(2)}%
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Analysis */}
        <Card>
          <CardHeader>
            <CardTitle>持倉明細</CardTitle>
          </CardHeader>
          <CardContent>
            {allAssets.length > 0 ? (
              <div className="space-y-4">
                {allAssets.map((asset, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">{asset?.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {asset?.type} • {asset?.currency}
                      </p>
                    </div>
                    <div className="text-right ml-4">
                      <p className="font-medium">
                        NT$ {asset?.currentValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </p>
                      <p
                        className={`text-sm ${
                          (asset?.profit || 0) >= 0
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {(asset?.profit || 0) >= 0 ? "+" : ""}
                        {asset?.profit.toLocaleString(undefined, { maximumFractionDigits: 0 })} (
                        {asset?.profitPercent.toFixed(2)}%)
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>尚無持倉資料</p>
                <p className="text-sm mt-2">開始新增資產以查看損益分析</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Note */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <p className="text-sm text-blue-900">
              <strong>提示：</strong>
              股票損益計算需要整合即時報價 API，目前僅顯示成本資訊。
              基金損益已根據淨值自動計算。
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
