import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Wallet, TrendingUp, PieChart, Bitcoin, DollarSign, ArrowUpRight, ArrowDownRight } from "lucide-react";

export default function Home() {
  const { data: currencies } = trpc.currencies.list.useQuery();
  const { data: banks } = trpc.banks.list.useQuery();
  const { data: fundHoldings } = trpc.fundHoldings.list.useQuery();
  const { data: stockHoldings } = trpc.stockHoldings.list.useQuery();
  const { data: cryptoHoldings } = trpc.cryptoHoldings.list.useQuery();

  // Calculate summary statistics
  const totalBanks = banks?.length || 0;
  const totalFunds = fundHoldings?.length || 0;
  const totalStocks = stockHoldings?.length || 0;
  const totalCrypto = cryptoHoldings?.length || 0;

  const stats = [
    {
      title: "銀行帳戶",
      value: totalBanks,
      icon: Wallet,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      href: "/banks",
    },
    {
      title: "基金持倉",
      value: totalFunds,
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-green-50",
      href: "/funds",
    },
    {
      title: "股票持倉",
      value: totalStocks,
      icon: PieChart,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      href: "/stocks",
    },
    {
      title: "虛擬資產",
      value: totalCrypto,
      icon: Bitcoin,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      href: "/crypto",
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">資產總覽</h1>
          <p className="text-muted-foreground mt-2">
            歡迎回來，查看您的投資組合概況
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.title} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-2">
                  持有項目數量
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                總資產價值
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">總計 (台幣)</p>
                  <p className="text-3xl font-bold mt-1">計算中...</p>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <ArrowUpRight className="h-4 w-4 text-green-600" />
                  <span className="text-green-600 font-medium">待實作損益計算</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>支援幣別</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {currencies?.slice(0, 4).map((currency) => (
                  <div key={currency.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{currency.symbol}</span>
                      <span className="text-sm text-muted-foreground">{currency.name}</span>
                    </div>
                    <span className="text-sm font-mono">
                      {parseFloat(currency.exchangeRate).toFixed(4)}
                    </span>
                  </div>
                ))}
                {currencies && currencies.length > 4 && (
                  <p className="text-xs text-muted-foreground text-center pt-2">
                    共 {currencies.length} 種幣別
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity Placeholder */}
        <Card>
          <CardHeader>
            <CardTitle>最近活動</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <p>尚無交易記錄</p>
              <p className="text-sm mt-2">開始新增您的資產以追蹤投資組合</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
