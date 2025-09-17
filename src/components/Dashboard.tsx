import React from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import { Transaction } from '../types';
import { convertToPKR } from '../utils/dateUtils';
import { TrendingUp, TrendingDown, DollarSign, Calendar } from 'lucide-react';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

interface DashboardProps {
  transactions: Transaction[];
}

const Dashboard: React.FC<DashboardProps> = ({ transactions }) => {
  // Use all transactions - no date filtering
  const allTransactions = transactions.filter(t => {
    try {
      // Just validate that the date is parseable
      new Date(t.date);
      return true;
    } catch (error) {
      console.error('Invalid date format:', t.date);
      return false;
    }
  });

  // Calculate overall totals
  const totals = allTransactions.reduce(
    (acc, transaction) => {
      const amount = convertToPKR(transaction.amount, transaction.currency);
      
      if (transaction.type === 'income') {
        acc.income += amount;
      } else {
        acc.expenses += amount;
      }
      return acc;
    },
    { income: 0, expenses: 0 }
  );

  const balance = totals.income - totals.expenses;

  // Group transactions by month for monthly breakdown
  const monthlyData = allTransactions.reduce((acc, transaction) => {
    try {
      const date = new Date(transaction.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
      
      if (!acc[monthKey]) {
        acc[monthKey] = {
          name: monthName,
          income: 0,
          expenses: 0,
          transactions: 0
        };
      }
      
      const amount = convertToPKR(transaction.amount, transaction.currency);
      if (transaction.type === 'income') {
        acc[monthKey].income += amount;
      } else {
        acc[monthKey].expenses += amount;
      }
      acc[monthKey].transactions += 1;
      
      return acc;
    } catch (error) {
      console.error('Error processing transaction date:', error);
      return acc;
    }
  }, {} as Record<string, { name: string; income: number; expenses: number; transactions: number }>);

  // Sort months by date (newest first)
  const sortedMonths = Object.entries(monthlyData)
    .sort(([a], [b]) => b.localeCompare(a))
    .slice(0, 12); // Show last 12 months

  // Category breakdown for income
  const incomeByCategory = allTransactions
    .filter(t => t.type === 'income')
    .reduce((acc, t) => {
      const amount = convertToPKR(t.amount, t.currency);
      acc[t.category] = (acc[t.category] || 0) + amount;
      return acc;
    }, {} as Record<string, number>);

  // Category breakdown for expenses
  const expensesByCategory = allTransactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => {
      const amount = convertToPKR(t.amount, t.currency);
      acc[t.category] = (acc[t.category] || 0) + amount;
      return acc;
    }, {} as Record<string, number>);

  const incomeChartData = {
    labels: Object.keys(incomeByCategory),
    datasets: [{
      data: Object.values(incomeByCategory),
      backgroundColor: [
        '#10B981', '#34D399', '#6EE7B7', '#A7F3D0', '#D1FAE5', '#ECFDF5'
      ],
      borderWidth: 2,
      borderColor: '#ffffff'
    }]
  };

  const expenseChartData = {
    labels: Object.keys(expensesByCategory),
    datasets: [{
      data: Object.values(expensesByCategory),
      backgroundColor: [
        '#EF4444', '#F87171', '#FCA5A5', '#FECACA', '#FEE2E2', '#FEF2F2', '#FDF2F2'
      ],
      borderWidth: 2,
      borderColor: '#ffffff'
    }]
  };

  // Monthly bar chart data
  const monthlyChartData = {
    labels: sortedMonths.map(([, data]) => data.name),
    datasets: [
      {
        label: 'Income',
        data: sortedMonths.map(([, data]) => data.income),
        backgroundColor: '#10B981',
        borderColor: '#059669',
        borderWidth: 1
      },
      {
        label: 'Expenses',
        data: sortedMonths.map(([, data]) => data.expenses),
        backgroundColor: '#EF4444',
        borderColor: '#DC2626',
        borderWidth: 1
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 15,
          usePointStyle: true,
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            return `${context.label}: PKR ${context.parsed.toLocaleString()}`;
          }
        }
      }
    }
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            return `${context.dataset.label}: PKR ${context.parsed.y.toLocaleString()}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value: any) {
            return 'PKR ' + value.toLocaleString();
          }
        }
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Info */}
      <div className="bg-[#f5f3f1] p-4 rounded-lg border border-[#d4c7b8]">
        <div className="flex items-center gap-2 text-[#806351]">
          <Calendar className="h-5 w-5" />
          <span className="font-medium">Showing all transaction data ({allTransactions.length} total transactions)</span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Total Income</h3>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">
                PKR {totals.income.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="p-3 bg-red-100 rounded-lg">
              <TrendingDown className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Total Expenses</h3>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">
                PKR {totals.expenses.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className={`p-3 rounded-lg ${balance >= 0 ? 'bg-[#f5f3f1]' : 'bg-orange-100'}`}>
              <DollarSign className={`h-6 w-6 ${balance >= 0 ? 'text-[#806351]' : 'text-orange-600'}`} />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Net Balance</h3>
              <p className={`text-xl sm:text-2xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                PKR {balance.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Breakdown */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Income vs Expenses</h3>
        {sortedMonths.length > 0 ? (
          <div className="h-80">
            <Bar data={monthlyChartData} options={barChartOptions} />
          </div>
        ) : (
          <div className="h-60 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <p className="text-lg font-medium">No transaction data</p>
              <p className="text-sm">Add transactions to see monthly breakdown</p>
            </div>
          </div>
        )}
      </div>

      {/* Monthly Summary Table */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Summary</h3>
        {sortedMonths.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Month</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-700">Income</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-700">Expenses</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-700">Net</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-700">Transactions</th>
                </tr>
              </thead>
              <tbody>
                {sortedMonths.map(([monthKey, data]) => {
                  const net = data.income - data.expenses;
                  return (
                    <tr key={monthKey} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium text-gray-900">{data.name}</td>
                      <td className="py-3 px-4 text-right text-green-600 font-medium">
                        PKR {data.income.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right text-red-600 font-medium">
                        PKR {data.expenses.toLocaleString()}
                      </td>
                      <td className={`py-3 px-4 text-right font-medium ${
                        net >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        PKR {net.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-center text-gray-600">
                        {data.transactions}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>No monthly data available</p>
            <p className="text-sm">Add transactions to see monthly breakdown</p>
          </div>
        )}
      </div>
      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Income by Category</h3>
          {Object.keys(incomeByCategory).length > 0 ? (
            <div className="h-80">
              <Doughnut data={incomeChartData} options={chartOptions} />
            </div>
          ) : (
            <div className="h-60 sm:h-80 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <p className="text-lg font-medium">No income data</p>
                <p className="text-sm">Add income transactions to see breakdown</p>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Expenses by Category</h3>
          {Object.keys(expensesByCategory).length > 0 ? (
            <div className="h-80">
              <div className="h-60 sm:h-80"><Doughnut data={expenseChartData} options={chartOptions} /></div>
            </div>
          ) : (
            <div className="h-60 sm:h-80 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <p className="text-lg font-medium">No expense data</p>
                <p className="text-sm">Add expense transactions to see breakdown</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Transaction Summary */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Transaction Summary</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-xl sm:text-2xl font-bold text-green-600">
              {allTransactions.filter(t => t.type === 'income').length}
            </p>
            <p className="text-sm text-gray-500">Income Entries</p>
          </div>
          <div>
            <p className="text-xl sm:text-2xl font-bold text-red-600">
              {allTransactions.filter(t => t.type === 'expense').length}
            </p>
            <p className="text-sm text-gray-500">Expense Entries</p>
          </div>
          <div>
            <p className="text-xl sm:text-2xl font-bold text-blue-600">
              {allTransactions.length}
            </p>
            <p className="text-sm text-gray-500">Total Entries</p>
          </div>
          <div>
            <p className="text-xl sm:text-2xl font-bold text-[#806351]">
              {new Set(allTransactions.map(t => t.category)).size}
            </p>
            <p className="text-sm text-gray-500">Categories Used</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;