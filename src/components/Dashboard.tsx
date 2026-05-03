import React, { useState } from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
} from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import { Transaction } from '../types';
import { convertToPKR } from '../utils/dateUtils';
import { TrendingUp, TrendingDown, DollarSign, RefreshCw, Activity } from 'lucide-react';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

type FilterType = 'daily' | 'weekly' | 'monthly';

interface DashboardProps {
  transactions: Transaction[];
  dateFilter?: unknown;
}

function getFilteredTransactions(transactions: Transaction[], filter: FilterType): Transaction[] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  return transactions.filter(t => {
    try {
      const d = new Date(t.date);
      if (filter === 'daily') {
        return d >= today;
      }
      if (filter === 'weekly') {
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        return d >= weekStart;
      }
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      return d >= monthStart;
    } catch {
      return false;
    }
  });
}

function getDayLabel(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  } catch {
    return dateStr;
  }
}

const FILTER_LABELS: Record<FilterType, string> = {
  daily: 'Today',
  weekly: 'This Week',
  monthly: 'This Month',
};

const Dashboard: React.FC<DashboardProps> = ({ transactions }) => {
  const [filter, setFilter] = useState<FilterType>('monthly');

  const filtered = getFilteredTransactions(transactions, filter);

  const totals = filtered.reduce(
    (acc, t) => {
      const amount = convertToPKR(t.amount, t.currency);
      if (t.type === 'income') acc.income += amount;
      else if (t.type === 'expense') acc.expenses += amount;
      else if (t.type === 'reinvestment') acc.reinvestment += amount;
      return acc;
    },
    { income: 0, expenses: 0, reinvestment: 0 }
  );

  const netProfit = totals.income - totals.expenses - totals.reinvestment;

  const entriesByDay = filtered.reduce((acc, t) => {
    acc[t.date] = (acc[t.date] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const sortedDays = Object.entries(entriesByDay).sort(([a], [b]) => a.localeCompare(b));

  const monthlyData = transactions.reduce((acc, t) => {
    try {
      const d = new Date(t.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const name = d.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
      if (!acc[key]) acc[key] = { name, income: 0, expenses: 0, reinvestment: 0 };
      const amount = convertToPKR(t.amount, t.currency);
      if (t.type === 'income') acc[key].income += amount;
      else if (t.type === 'expense') acc[key].expenses += amount;
      else if (t.type === 'reinvestment') acc[key].reinvestment += amount;
    } catch { /* skip */ }
    return acc;
  }, {} as Record<string, { name: string; income: number; expenses: number; reinvestment: number }>);

  const sortedMonths = Object.entries(monthlyData)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12);

  const incomeByCategory = filtered
    .filter(t => t.type === 'income')
    .reduce((acc, t) => { acc[t.category] = (acc[t.category] || 0) + convertToPKR(t.amount, t.currency); return acc; }, {} as Record<string, number>);

  const expenseByCategory = filtered
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => { acc[t.category] = (acc[t.category] || 0) + convertToPKR(t.amount, t.currency); return acc; }, {} as Record<string, number>);

  const reinvestByCategory = filtered
    .filter(t => t.type === 'reinvestment')
    .reduce((acc, t) => { acc[t.category] = (acc[t.category] || 0) + convertToPKR(t.amount, t.currency); return acc; }, {} as Record<string, number>);

  const overviewChartData = {
    labels: ['Income', 'Expenses', 'Reinvestment'],
    datasets: [{
      data: [totals.income, totals.expenses, totals.reinvestment],
      backgroundColor: ['#10B981', '#EF4444', '#F59E0B'],
      borderWidth: 2,
      borderColor: '#ffffff',
    }],
  };

  const dailyActivityChartData = {
    labels: sortedDays.map(([date]) => getDayLabel(date)),
    datasets: [{
      label: 'Entries',
      data: sortedDays.map(([, count]) => count),
      backgroundColor: '#806351',
      borderColor: '#6b5444',
      borderWidth: 1,
      borderRadius: 4,
    }],
  };

  const monthlyChartData = {
    labels: sortedMonths.map(([, d]) => d.name),
    datasets: [
      { label: 'Income', data: sortedMonths.map(([, d]) => d.income), backgroundColor: '#10B981', borderColor: '#059669', borderWidth: 1 },
      { label: 'Expenses', data: sortedMonths.map(([, d]) => d.expenses), backgroundColor: '#EF4444', borderColor: '#DC2626', borderWidth: 1 },
      { label: 'Reinvestment', data: sortedMonths.map(([, d]) => d.reinvestment), backgroundColor: '#F59E0B', borderColor: '#D97706', borderWidth: 1 },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' as const, labels: { padding: 15, usePointStyle: true, font: { size: 12 } } },
      tooltip: { callbacks: { label: (ctx: any) => `${ctx.label}: PKR ${ctx.parsed.toLocaleString()}` } },
    },
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' as const },
      tooltip: { callbacks: { label: (ctx: any) => `${ctx.dataset.label}: PKR ${ctx.parsed.y.toLocaleString()}` } },
    },
    scales: { y: { beginAtZero: true, ticks: { callback: (v: any) => 'PKR ' + Number(v).toLocaleString() } } },
  };

  const activityBarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: (ctx: any) => `${ctx.parsed.y} entries` } },
    },
    scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
  };

  const summaryCards = [
    { label: 'Total Income', value: totals.income, color: 'text-green-600', bg: 'bg-green-100', Icon: TrendingUp, iconColor: 'text-green-600' },
    { label: 'Total Expenses', value: totals.expenses, color: 'text-red-600', bg: 'bg-red-100', Icon: TrendingDown, iconColor: 'text-red-600' },
    { label: 'Total Reinvestment', value: totals.reinvestment, color: 'text-amber-600', bg: 'bg-amber-100', Icon: RefreshCw, iconColor: 'text-amber-600' },
    {
      label: 'Net Profit',
      value: netProfit,
      color: netProfit >= 0 ? 'text-green-600' : 'text-red-600',
      bg: netProfit >= 0 ? 'bg-[#f5f3f1]' : 'bg-orange-100',
      Icon: DollarSign,
      iconColor: netProfit >= 0 ? 'text-[#806351]' : 'text-orange-600',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Time Filter */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-sm font-medium text-gray-700">View Period:</span>
          <div className="flex gap-2">
            {(Object.keys(FILTER_LABELS) as FilterType[]).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === f ? 'bg-[#806351] text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {FILTER_LABELS[f]}
              </button>
            ))}
          </div>
          <span className="text-xs text-gray-400 ml-auto hidden sm:block">{filtered.length} transactions in period</span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map(({ label, value, color, bg, Icon, iconColor }) => (
          <div key={label} className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-lg ${bg} flex-shrink-0`}>
                <Icon className={`h-5 w-5 ${iconColor}`} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-gray-500 truncate">{label}</p>
                <p className={`text-base sm:text-lg font-bold ${color} truncate`}>
                  PKR {Math.abs(value).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Net Profit formula note */}
      <div className="bg-[#f5f3f1] rounded-xl border border-[#d4c7b8] px-5 py-3 flex items-center gap-3 flex-wrap">
        <span className="text-sm text-[#6b5444] font-medium">Net Profit Formula:</span>
        <span className="text-sm text-gray-700">Income <span className="text-green-600 font-semibold">(PKR {totals.income.toLocaleString()})</span></span>
        <span className="text-gray-400">−</span>
        <span className="text-sm text-gray-700">Expenses <span className="text-red-600 font-semibold">(PKR {totals.expenses.toLocaleString()})</span></span>
        <span className="text-gray-400">−</span>
        <span className="text-sm text-gray-700">Reinvestment <span className="text-amber-600 font-semibold">(PKR {totals.reinvestment.toLocaleString()})</span></span>
        <span className="text-gray-400">=</span>
        <span className={`text-sm font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          PKR {netProfit.toLocaleString()}
        </span>
      </div>

      {/* Period Breakdown */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Activity className="h-5 w-5 text-[#806351]" />
          {FILTER_LABELS[filter]} Breakdown
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Income Entries', count: filtered.filter(t => t.type === 'income').length, color: 'text-green-600', bg: 'bg-green-50' },
            { label: 'Expense Entries', count: filtered.filter(t => t.type === 'expense').length, color: 'text-red-600', bg: 'bg-red-50' },
            { label: 'Reinvestment', count: filtered.filter(t => t.type === 'reinvestment').length, color: 'text-amber-600', bg: 'bg-amber-50' },
            { label: 'Total Entries', count: filtered.length, color: 'text-[#806351]', bg: 'bg-[#f5f3f1]' },
          ].map(({ label, count, color, bg }) => (
            <div key={label} className={`${bg} p-4 rounded-xl text-center`}>
              <p className={`text-3xl font-bold ${color}`}>{count}</p>
              <p className="text-xs text-gray-600 mt-1">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Overview chart + Daily Activity */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Income vs Expenses vs Reinvestment
          </h3>
          {totals.income + totals.expenses + totals.reinvestment > 0 ? (
            <div className="h-72">
              <Doughnut data={overviewChartData} options={doughnutOptions} />
            </div>
          ) : (
            <div className="h-72 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <p className="font-medium">No data for this period</p>
                <p className="text-sm">Add transactions to see breakdown</p>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Activity (Entries Per Day)</h3>
          {sortedDays.length > 0 ? (
            <div className="h-72">
              <Bar data={dailyActivityChartData} options={activityBarOptions} />
            </div>
          ) : (
            <div className="h-72 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <p className="font-medium">No activity</p>
                <p className="text-sm">No entries for this period</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Per-day entries table */}
      {sortedDays.length > 0 && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Entries Per Day</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-4 font-medium text-gray-700">Date</th>
                  <th className="text-right py-2 px-4 font-medium text-green-700">Income</th>
                  <th className="text-right py-2 px-4 font-medium text-red-700">Expenses</th>
                  <th className="text-right py-2 px-4 font-medium text-amber-700">Reinvestment</th>
                  <th className="text-center py-2 px-4 font-medium text-gray-700">Entries</th>
                </tr>
              </thead>
              <tbody>
                {sortedDays.map(([date]) => {
                  const dayTx = filtered.filter(t => t.date === date);
                  const dayIncome = dayTx.filter(t => t.type === 'income').reduce((s, t) => s + convertToPKR(t.amount, t.currency), 0);
                  const dayExpense = dayTx.filter(t => t.type === 'expense').reduce((s, t) => s + convertToPKR(t.amount, t.currency), 0);
                  const dayReinvest = dayTx.filter(t => t.type === 'reinvestment').reduce((s, t) => s + convertToPKR(t.amount, t.currency), 0);
                  return (
                    <tr key={date} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-2.5 px-4 font-medium text-gray-900">{getDayLabel(date)}</td>
                      <td className="py-2.5 px-4 text-right text-green-600">
                        {dayIncome > 0 ? `PKR ${dayIncome.toLocaleString()}` : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="py-2.5 px-4 text-right text-red-600">
                        {dayExpense > 0 ? `PKR ${dayExpense.toLocaleString()}` : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="py-2.5 px-4 text-right text-amber-600">
                        {dayReinvest > 0 ? `PKR ${dayReinvest.toLocaleString()}` : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#f5f3f1] text-[#806351] text-xs font-semibold">
                          {dayTx.length}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Monthly bar chart (all-time) */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Overview (All Time)</h3>
        {sortedMonths.length > 0 ? (
          <div className="h-80">
            <Bar data={monthlyChartData} options={barOptions} />
          </div>
        ) : (
          <div className="h-60 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <p className="font-medium">No transaction data</p>
              <p className="text-sm">Add transactions to see monthly chart</p>
            </div>
          </div>
        )}
      </div>

      {/* Category Doughnut Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {[
          { title: 'Income by Category', data: incomeByCategory, colors: ['#10B981','#34D399','#6EE7B7','#A7F3D0','#D1FAE5'] },
          { title: 'Expenses by Category', data: expenseByCategory, colors: ['#EF4444','#F87171','#FCA5A5','#FECACA','#FEE2E2'] },
          { title: 'Reinvestment by Category', data: reinvestByCategory, colors: ['#F59E0B','#FBB054','#FCD34D','#FDE68A','#FEF3C7'] },
        ].map(({ title, data, colors }) => {
          const chartData = {
            labels: Object.keys(data),
            datasets: [{ data: Object.values(data), backgroundColor: colors, borderWidth: 2, borderColor: '#ffffff' }],
          };
          return (
            <div key={title} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="text-base font-semibold text-gray-900 mb-4">{title}</h3>
              {Object.keys(data).length > 0 ? (
                <div className="h-64">
                  <Doughnut data={chartData} options={doughnutOptions} />
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-400 text-sm text-center">
                  <div>
                    <p className="font-medium">No data</p>
                    <p>for {FILTER_LABELS[filter].toLowerCase()}</p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* All-time transaction counts */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">All-Time Transaction Count</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          {[
            { val: transactions.filter(t => t.type === 'income').length, label: 'Income Entries', color: 'text-green-600' },
            { val: transactions.filter(t => t.type === 'expense').length, label: 'Expense Entries', color: 'text-red-600' },
            { val: transactions.filter(t => t.type === 'reinvestment').length, label: 'Reinvestment Entries', color: 'text-amber-600' },
            { val: transactions.length, label: 'Total Entries', color: 'text-[#806351]' },
          ].map(({ val, label, color }) => (
            <div key={label}>
              <p className={`text-2xl font-bold ${color}`}>{val}</p>
              <p className="text-sm text-gray-500 mt-1">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
