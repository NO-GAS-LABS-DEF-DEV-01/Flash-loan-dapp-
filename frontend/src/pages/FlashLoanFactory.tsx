'use client';

import { useState } from 'react';
import { Plus, Zap, TrendingUp, AlertCircle, Loader2, Play, Pause, Trash2, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { trpc } from '@/lib/trpc';

interface FlashLoan {
  id: number;
  name: string;
  protocol: 'aave' | 'uniswap' | 'dydx' | 'sui-native';
  amount: string;
  repaymentAmount: string;
  status: 'active' | 'paused' | 'completed';
  createdAt: Date;
}

export default function FlashLoanFactory() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newLoan, setNewLoan] = useState({
    name: '',
    protocol: 'sui-native' as const,
    assetAddress: '',
    amount: '',
    repaymentAmount: '',
    maxFeePercentage: 0.5,
  });

  const { data: loans, isLoading, refetch } = trpc.flashLoans.getAll.useQuery();
  const { data: stats } = trpc.flashLoans.getStats.useQuery();
  const createMutation = trpc.flashLoans.create.useMutation();
  const executeMutation = trpc.flashLoans.execute.useMutation();
  const deleteMutation = trpc.flashLoans.delete.useMutation();
  const statusMutation = trpc.flashLoans.updateStatus.useMutation();

  const handleCreateLoan = async () => {
    if (!newLoan.name.trim() || !newLoan.amount) return;

    try {
      await createMutation.mutateAsync({
        ...newLoan,
        maxFeePercentage: newLoan.maxFeePercentage,
      });
      setNewLoan({
        name: '',
        protocol: 'sui-native',
        assetAddress: '',
        amount: '',
        repaymentAmount: '',
        maxFeePercentage: 0.5,
      });
      setIsDialogOpen(false);
      refetch();
    } catch (error) {
      console.error('Error creating loan:', error);
    }
  };

  const handleExecute = async (loanId: number) => {
    try {
      await executeMutation.mutateAsync({ loanId });
      refetch();
    } catch (error) {
      console.error('Error executing loan:', error);
    }
  };

  const handleDelete = async (loanId: number) => {
    try {
      await deleteMutation.mutateAsync({ loanId });
      refetch();
    } catch (error) {
      console.error('Error deleting loan:', error);
    }
  };

  const handleToggleStatus = async (loanId: number, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'paused' : 'active';
      await statusMutation.mutateAsync({ loanId, status: newStatus as any });
      refetch();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const getProtocolColor = (protocol: string) => {
    const colors: Record<string, string> = {
      'aave': 'bg-purple-500/10 text-purple-700 border-purple-200',
      'uniswap': 'bg-pink-500/10 text-pink-700 border-pink-200',
      'dydx': 'bg-yellow-500/10 text-yellow-700 border-yellow-200',
      'sui-native': 'bg-blue-500/10 text-blue-700 border-blue-200',
    };
    return colors[protocol] || 'bg-gray-500/10 text-gray-700 border-gray-200';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/10 text-green-700 border-green-200';
      case 'paused':
        return 'bg-yellow-500/10 text-yellow-700 border-yellow-200';
      case 'completed':
        return 'bg-blue-500/10 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-500/10 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-8 h-8 text-yellow-500" />
            <h1 className="text-3xl md:text-4xl font-bold text-white">Flash Loan Factory</h1>
          </div>
          <p className="text-slate-400">Sui blockchain flash loan execution and management</p>
        </div>

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-400">Total Loans</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{stats.totalLoans}</div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-400">Successful Txs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-500">{stats.successfulTransactions}</div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-400">Total Profit</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-500">{stats.totalProfit} SUI</div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-400">Avg Profit/Tx</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-500">{stats.averageProfitPerTx} SUI</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Create Loan Button */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="mb-8 w-full md:w-auto bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700">
              <Plus className="w-4 h-4 mr-2" />
              Create Flash Loan
            </Button>
          </DialogTrigger>
          <DialogContent className="w-full max-w-md">
            <DialogHeader>
              <DialogTitle>Create Flash Loan</DialogTitle>
              <DialogDescription>
                Configure a new flash loan for Sui blockchain execution
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="loan-name">Loan Name</Label>
                <Input
                  id="loan-name"
                  placeholder="My Flash Loan"
                  value={newLoan.name}
                  onChange={(e) => setNewLoan({ ...newLoan, name: e.target.value })}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="protocol">Protocol</Label>
                <Select value={newLoan.protocol} onValueChange={(val) => setNewLoan({ ...newLoan, protocol: val as any })}>
                  <SelectTrigger id="protocol" className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sui-native">Sui Native</SelectItem>
                    <SelectItem value="aave">Aave</SelectItem>
                    <SelectItem value="uniswap">Uniswap</SelectItem>
                    <SelectItem value="dydx">dYdX</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="asset-address">Asset Address</Label>
                <Input
                  id="asset-address"
                  placeholder="0x..."
                  value={newLoan.assetAddress}
                  onChange={(e) => setNewLoan({ ...newLoan, assetAddress: e.target.value })}
                  className="mt-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="amount">Borrow Amount</Label>
                  <Input
                    id="amount"
                    placeholder="1000"
                    value={newLoan.amount}
                    onChange={(e) => setNewLoan({ ...newLoan, amount: e.target.value })}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="repayment">Repayment Amount</Label>
                  <Input
                    id="repayment"
                    placeholder="1010"
                    value={newLoan.repaymentAmount}
                    onChange={(e) => setNewLoan({ ...newLoan, repaymentAmount: e.target.value })}
                    className="mt-2"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="fee">Max Fee %</Label>
                <Input
                  id="fee"
                  type="number"
                  step="0.1"
                  placeholder="0.5"
                  value={newLoan.maxFeePercentage}
                  onChange={(e) => setNewLoan({ ...newLoan, maxFeePercentage: parseFloat(e.target.value) })}
                  className="mt-2"
                />
              </div>

              <Button
                onClick={handleCreateLoan}
                className="w-full bg-yellow-600 hover:bg-yellow-700"
                disabled={!newLoan.name.trim() || !newLoan.amount}
              >
                Create Loan
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Loans List */}
        <div className="space-y-4">
          {isLoading ? (
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="pt-8 flex justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
              </CardContent>
            </Card>
          ) : !loans || loans.length === 0 ? (
            <Alert className="bg-slate-800 border-slate-700">
              <AlertCircle className="h-4 w-4 text-slate-400" />
              <AlertDescription className="text-slate-300">
                No flash loans yet. Create your first loan to get started!
              </AlertDescription>
            </Alert>
          ) : (
            loans.map((loan: any) => (
              <Card key={loan.id} className="bg-slate-800 border-slate-700 hover:border-slate-600 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <CardTitle className="text-white truncate">{loan.name}</CardTitle>
                        <Badge className={`whitespace-nowrap ${getProtocolColor(loan.protocol)}`}>
                          {loan.protocol}
                        </Badge>
                      </div>
                      <CardDescription className="text-slate-400">
                        {loan.amount} → {loan.repaymentAmount} SUI
                      </CardDescription>
                    </div>
                    <Badge className={`whitespace-nowrap ${getStatusColor(loan.status)}`}>
                      {loan.status}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleToggleStatus(loan.id, loan.status)}
                      className="bg-slate-700 hover:bg-slate-600 border-slate-600 text-white"
                    >
                      {loan.status === 'active' ? (
                        <>
                          <Pause className="w-4 h-4 mr-1" />
                          Pause
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 mr-1" />
                          Resume
                        </>
                      )}
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleExecute(loan.id)}
                      disabled={executeMutation.isPending}
                      className="bg-yellow-700 hover:bg-yellow-600 border-yellow-600 text-white"
                    >
                      {executeMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                          Executing...
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4 mr-1" />
                          Execute
                        </>
                      )}
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-slate-700 hover:bg-slate-600 border-slate-600 text-white"
                    >
                      <Copy className="w-4 h-4 mr-1" />
                      Clone
                    </Button>

                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(loan.id)}
                      className="bg-red-900/50 hover:bg-red-900 border-red-700 text-red-200"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
