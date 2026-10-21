import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
	ArrowLeft,
	DollarSign,
	TrendingUp,
	TrendingDown,
	AlertTriangle,
	Calendar,
	PieChart as PieIcon,
	BarChart3,
	Edit,
	Sparkles
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import {
	PieChart as RechartsPieChart,
	Pie,
	Cell,
	BarChart,
	Bar,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
	LineChart,
	Line
} from 'recharts';
import { fetchTrip } from '../store/slices/tripSlice';
import { budgetAPI } from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import BudgetEditModal from '../components/budget/BudgetEditModal';

const TripBudget = () => {
	const { tripId } = useParams();
	const dispatch = useDispatch();
	const { currentTrip: trip, tripLoading: loading, tripError: error } = useSelector((state) => state.trips);

	const [budgetData, setBudgetData] = useState(null);
	const [budgetLoading, setBudgetLoading] = useState(true);
	const [budgetError, setBudgetError] = useState(null);
	const [viewMode, setViewMode] = useState('overview'); // overview | daily | category
	const [editModalOpen, setEditModalOpen] = useState(false);
	const [aiGenerating, setAiGenerating] = useState(false);

	useEffect(() => {
		if (tripId) {
			dispatch(fetchTrip(tripId));
			fetchBudget();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [tripId]);

	const fetchBudget = async () => {
		try {
			setBudgetLoading(true);
			setBudgetError(null); // Clear any previous errors
			const res = await budgetAPI.getBudget(tripId);
			if (res.data.success === false) {
				throw new Error(res.data.message || 'Failed to load budget');
			}
			setBudgetData(res.data.data);
		} catch (e) {
			console.error('Budget fetch error:', e);
			setBudgetError(e.response?.data?.message || e.message || 'Failed to load budget');
			setBudgetData(null); // Clear any previous data
		} finally {
			setBudgetLoading(false);
		}
	};

	const handleGenerateAIBudget = async () => {
		try {
			setAiGenerating(true);
			const res = await budgetAPI.generateAIBudget(tripId, {
				travelStyle: 'moderate',
				groupSize: 1
			});
			if (res.data?.success) {
				toast.success('Budget estimated with Gemini AI!');
				await fetchBudget();
				dispatch(fetchTrip(tripId));
			} else {
				toast.error(res.data?.message || 'Failed to generate budget');
			}
		} catch (e) {
			toast.error(e.response?.data?.message || 'Failed to generate AI budget');
		} finally {
			setAiGenerating(false);
		}
	};

	const formatCurrency = (amount = 0, currency = 'USD') => new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency,
		maximumFractionDigits: 0
	}).format(amount);

	const formatDateShort = (dateString) => new Date(dateString).toLocaleDateString('en-US', {
		month: 'short',
		day: 'numeric'
	});

	const COLORS = {
		accommodation: '#8B5CF6',
		transportation: '#06B6D4',
		activities: '#F59E0B',
		food: '#EF4444',
		other: '#10B981'
	};

	const pieChartData = budgetData ? Object.entries(budgetData.breakdown || {})
		.filter(([, v]) => v > 0)
		.map(([k, v]) => ({ name: k.charAt(0).toUpperCase() + k.slice(1), value: v, color: COLORS[k] })) : [];

	const dailyChartData = budgetData ? Object.entries(budgetData.dailyBreakdown || {})
		.sort(([a], [b]) => new Date(a) - new Date(b))
		.map(([date, d]) => ({
			date: formatDateShort(date),
			fullDate: date,
			accommodation: d.accommodation,
			transportation: d.transportation,
			activities: d.activities,
			food: d.food,
			other: d.other,
			total: d.total
		})) : [];

	const overBudgetDays = (() => {
		if (!budgetData || !trip?.budget?.total) return [];
		const avg = trip.budget.total / budgetData.tripDays;
		return Object.entries(budgetData.dailyBreakdown || {})
			.filter(([, d]) => d.total > avg)
			.map(([date, d]) => ({ date, total: d.total, overage: d.total - avg }));
	})();

	const stats = (() => {
		if (!budgetData || !trip?.budget?.total) return null;
		const totalSpent = budgetData.total;
		const totalBudget = trip.budget.total;
		const remaining = totalBudget - totalSpent;
		const averageDaily = totalSpent / budgetData.tripDays;
		return {
			totalSpent,
			totalBudget,
			remaining,
			percentageUsed: (totalSpent / totalBudget) * 100,
			averageDaily,
			isOverBudget: totalSpent > totalBudget
		};
	})();

	if (loading || budgetLoading) {
		return <div className="flex justify-center items-center h-64"><LoadingSpinner size="lg" /></div>;
	}

	if (error || budgetError) {
		return (
			<div className="text-center py-12">
				<div className="bg-red-50 border border-red-200 rounded-md p-6 inline-block">
					<h3 className="text-lg font-medium text-red-900 mb-2">Error</h3>
						<p className="text-red-700 mb-4">{error || budgetError}</p>
						<Link to={`/trips/${tripId}`} className="btn-secondary inline-flex items-center"><ArrowLeft className="h-4 w-4 mr-2" />Back</Link>
				</div>
			</div>
		);
	}

	if (!trip || !budgetData || !stats) {
		return (
			<div className="text-center py-12">
				<h3 className="text-lg font-medium text-gray-900 mb-2">No Budget Data</h3>
				<Link to={`/trips/${tripId}`} className="btn-secondary inline-flex items-center"><ArrowLeft className="h-4 w-4 mr-2" />Back to Trip</Link>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div className="flex items-center space-x-4">
					<Link to={`/trips/${tripId}`} className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"><ArrowLeft className="h-5 w-5" /></Link>
					<div>
						<h1 className="text-2xl font-bold text-gray-900">Budget & Cost Breakdown</h1>
						<p className="text-gray-600">{trip.name}</p>
					</div>
				</div>
				<div className="flex items-center space-x-3">
					<button
						onClick={handleGenerateAIBudget}
						disabled={aiGenerating}
						className="btn-primary inline-flex items-center text-sm"
						title="Use Gemini AI to estimate budget and category breakdown"
					>
						<Sparkles className="h-4 w-4 mr-2" />
						{aiGenerating ? 'Estimating with Gemini...' : 'AI Budget Estimate'}
					</button>
					<button onClick={() => setEditModalOpen(true)} className="btn-secondary inline-flex items-center"><Edit className="h-4 w-4 mr-2" />Edit Budget</button>
				</div>
			</div>

			{/* KPI Cards */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
				<div className="card"><div className="card-body flex items-center"><DollarSign className="h-8 w-8 text-blue-600" /><div className="ml-3"><p className="text-sm text-gray-500">Total Budget</p><p className="text-lg font-semibold">{formatCurrency(stats.totalBudget, budgetData.currency)}</p></div></div></div>
				<div className="card"><div className="card-body flex items-center"><TrendingUp className={`h-8 w-8 ${stats.isOverBudget? 'text-red-600':'text-green-600'}`} /><div className="ml-3"><p className="text-sm text-gray-500">Spent</p><p className={`text-lg font-semibold ${stats.isOverBudget? 'text-red-600':'text-gray-900'}`}>{formatCurrency(stats.totalSpent, budgetData.currency)}</p><p className="text-xs text-gray-500">{stats.percentageUsed.toFixed(1)}% used</p></div></div></div>
				<div className="card"><div className="card-body flex items-center">{stats.remaining>=0? <TrendingDown className="h-8 w-8 text-green-600" />:<AlertTriangle className="h-8 w-8 text-red-600" />}<div className="ml-3"><p className="text-sm text-gray-500">{stats.remaining>=0? 'Remaining':'Over Budget'}</p><p className={`text-lg font-semibold ${stats.remaining>=0? 'text-green-600':'text-red-600'}`}>{formatCurrency(Math.abs(stats.remaining), budgetData.currency)}</p></div></div></div>
				<div className="card"><div className="card-body flex items-center"><Calendar className="h-8 w-8 text-purple-600" /><div className="ml-3"><p className="text-sm text-gray-500">Avg / Day</p><p className="text-lg font-semibold">{formatCurrency(stats.averageDaily, budgetData.currency)}</p><p className="text-xs text-gray-500">{budgetData.tripDays} days</p></div></div></div>
			</div>

			{(overBudgetDays.length>0 || stats.isOverBudget) && (
				<div className="card border-red-200 bg-red-50"><div className="card-body flex"><AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" /><div className="ml-3 text-sm text-red-700 space-y-1"><p className="font-medium">Budget Alerts</p>{stats.isOverBudget && <p>Overall spending exceeds budget by {formatCurrency(Math.abs(stats.remaining), budgetData.currency)}</p>}{overBudgetDays.length>0 && <p>{overBudgetDays.length} day(s) exceed average daily budget</p>}</div></div></div>
			)}

			<div className="border-b border-gray-200">
				<nav className="flex space-x-8">
					{[{id:'overview',name:'Overview',icon:PieIcon},{id:'daily',name:'Daily',icon:BarChart3},{id:'category',name:'Categories',icon:TrendingUp}].map(t => (
						<button key={t.id} onClick={()=>setViewMode(t.id)} className={`${viewMode===t.id? 'border-primary-500 text-primary-600':'border-transparent text-gray-500 hover:text-gray-700'} flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm`}>
							<t.icon className="h-4 w-4" /><span>{t.name}</span>
						</button>
					))}
				</nav>
			</div>

			{viewMode==='overview' && (
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
					<div className="card"><div className="card-header"><h3 className="text-lg font-semibold">Spending by Category</h3></div><div className="card-body">{pieChartData.length? <ResponsiveContainer width="100%" height={300}><RechartsPieChart><Pie data={pieChartData} dataKey="value" cx="50%" cy="50%" outerRadius={90} label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`}><>{pieChartData.map((d,i)=><Cell key={i} fill={d.color} />)}</></Pie><Tooltip formatter={(v)=>formatCurrency(v,budgetData.currency)} /></RechartsPieChart></ResponsiveContainer>: <div className="h-60 flex items-center justify-center text-gray-500">No data</div>}</div></div>
					<div className="card"><div className="card-header"><h3 className="text-lg font-semibold">Category Breakdown</h3></div><div className="card-body space-y-4">{Object.entries(budgetData.breakdown).map(([cat,amt])=>{const pct = budgetData.total? (amt/budgetData.total)*100:0; return (<div key={cat} className="flex items-center justify-between"><div className="flex items-center space-x-3"><span className="w-4 h-4 rounded-full" style={{background:COLORS[cat]}}></span><span className="capitalize text-sm font-medium">{cat}</span></div><div className="text-right"><p className="text-sm font-semibold">{formatCurrency(amt,budgetData.currency)}</p><p className="text-xs text-gray-500">{pct.toFixed(1)}%</p></div></div>);})}</div></div>
				</div>
			)}

			{viewMode==='daily' && (
				<div className="space-y-6">
					<div className="card"><div className="card-header"><h3 className="text-lg font-semibold">Daily Stacked Spend</h3></div><div className="card-body">{dailyChartData.length? <ResponsiveContainer width="100%" height={380}><BarChart data={dailyChartData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" /><YAxis tickFormatter={(v)=>formatCurrency(v,budgetData.currency)} /><Tooltip formatter={(v,n)=>[formatCurrency(v,budgetData.currency),n]} />{['accommodation','transportation','activities','food','other'].map(k=> <Bar key={k} dataKey={k} stackId="a" fill={COLORS[k]} />)}</BarChart></ResponsiveContainer>: <div className="h-60 flex items-center justify-center text-gray-500">No daily data</div>}</div></div>
					{dailyChartData.length>0 && (<div className="card"><div className="card-header"><h3 className="text-lg font-semibold">Daily Trend</h3></div><div className="card-body"><ResponsiveContainer width="100%" height={280}><LineChart data={dailyChartData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" /><YAxis tickFormatter={(v)=>formatCurrency(v,budgetData.currency)} /><Tooltip formatter={(v)=>formatCurrency(v,budgetData.currency)} /><Line type="monotone" dataKey="total" stroke="#8B5CF6" strokeWidth={2} /></LineChart></ResponsiveContainer></div></div>)}</div>
			)}

			{viewMode==='category' && (
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
					{Object.entries(budgetData.breakdown).map(([cat,amt]) => (
						<div key={cat} className="card">
							<div className="card-header flex items-center space-x-2">
								<span className="w-4 h-4 rounded-full" style={{background:COLORS[cat]}}></span>
								<h3 className="text-lg font-semibold capitalize">{cat}</h3>
							</div>
							<div className="card-body text-center space-y-1">
								<p className="text-3xl font-bold">{formatCurrency(amt,budgetData.currency)}</p>
								<p className="text-xs text-gray-500">{budgetData.total? ((amt/budgetData.total)*100).toFixed(1):0}% of total</p>
								<p className="text-xs text-gray-400">{formatCurrency(amt / budgetData.tripDays, budgetData.currency)} / day</p>
							</div>
						</div>
					))}
				</div>
			)}

			<BudgetEditModal
				isOpen={editModalOpen}
				onClose={() => setEditModalOpen(false)}
				tripId={tripId}
				currentBudget={trip?.budget}
				onUpdate={() => { fetchBudget(); dispatch(fetchTrip(tripId)); }}
			/>
		</div>
	);
};

export default TripBudget;

