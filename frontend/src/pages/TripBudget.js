import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
	ArrowLeft,
	TrendingUp,
	AlertTriangle,
	Calendar,
	PieChart as PieIcon,
	BarChart3,
	Edit,
	Sparkles,
	Lightbulb,
	MapPin,
	Users,
	ChevronDown,
	ChevronUp,
	Info,
	CheckCircle,
	Zap,
	Target,
	Wallet,
	ArrowUpRight,
	ArrowDownRight
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
	Line,
	Legend,
	RadialBarChart,
	RadialBar
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
	const [viewMode, setViewMode] = useState('overview');
	const [editModalOpen, setEditModalOpen] = useState(false);
	const [aiGenerating, setAiGenerating] = useState(false);
	const [travelStyle, setTravelStyle] = useState('moderate');
	const [groupSize, setGroupSize] = useState(1);
	const [showSuggestions, setShowSuggestions] = useState(true);

	const fetchBudget = useCallback(async (style, size) => {
		try {
			setBudgetLoading(true);
			setBudgetError(null);
			const res = await budgetAPI.getBudget(tripId, { travelStyle: style || travelStyle, groupSize: size || groupSize });
			if (res.data.success === false) {
				throw new Error(res.data.message || 'Failed to load budget');
			}
			setBudgetData(res.data.data);
		} catch (e) {
			console.error('Budget fetch error:', e);
			setBudgetError(e.response?.data?.message || e.message || 'Failed to load budget');
			setBudgetData(null);
		} finally {
			setBudgetLoading(false);
		}
	}, [tripId, travelStyle, groupSize]);

	useEffect(() => {
		if (tripId) {
			dispatch(fetchTrip(tripId));
			fetchBudget();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [tripId]);

	const handleStyleChange = (newStyle) => {
		setTravelStyle(newStyle);
		fetchBudget(newStyle, groupSize);
	};

	const handleGroupSizeChange = (newSize) => {
		const s = Math.max(1, parseInt(newSize) || 1);
		setGroupSize(s);
		fetchBudget(travelStyle, s);
	};

	const handleGenerateAIBudget = async () => {
		try {
			setAiGenerating(true);
			const res = await budgetAPI.generateAIBudget(tripId, {
				travelStyle,
				groupSize
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

	const CATEGORY_ICONS = {
		accommodation: '🏨',
		transportation: '✈️',
		activities: '🎯',
		food: '🍽️',
		other: '📦'
	};

	const STYLE_LABELS = {
		budget: { label: 'Budget', emoji: '🎒', desc: 'Hostels, street food, public transport' },
		moderate: { label: 'Moderate', emoji: '🧳', desc: 'Mid-range hotels, local restaurants' },
		luxury: { label: 'Luxury', emoji: '✨', desc: 'Premium hotels, fine dining, private transport' }
	};

	const SUGGESTION_ICONS = {
		warning: <AlertTriangle className="h-5 w-5 text-amber-500" />,
		danger: <AlertTriangle className="h-5 w-5 text-red-500" />,
		info: <Info className="h-5 w-5 text-blue-500" />,
		success: <CheckCircle className="h-5 w-5 text-green-500" />,
		tip: <Lightbulb className="h-5 w-5 text-purple-500" />,
	};

	const SUGGESTION_BG = {
		warning: 'bg-amber-50 border-amber-200',
		danger: 'bg-red-50 border-red-200',
		info: 'bg-blue-50 border-blue-200',
		success: 'bg-green-50 border-green-200',
		tip: 'bg-purple-50 border-purple-200',
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
			total: d.total,
			destination: d.destination || ''
		})) : [];

	const overBudgetDays = (() => {
		if (!budgetData || !trip?.budget?.total) return [];
		const avg = trip.budget.total / budgetData.tripDays;
		return Object.entries(budgetData.dailyBreakdown || {})
			.filter(([, d]) => d.total > avg)
			.map(([date, d]) => ({ date, total: d.total, overage: d.total - avg }));
	})();

	const stats = (() => {
		if (!budgetData) return null;
		const totalEstimated = budgetData.total;
		const totalBudget = trip?.budget?.total || 0;
		const remaining = totalBudget - totalEstimated;
		const averageDaily = totalEstimated / budgetData.tripDays;
		return {
			totalEstimated,
			totalBudget,
			remaining,
			percentageUsed: totalBudget > 0 ? (totalEstimated / totalBudget) * 100 : 0,
			averageDaily,
			isOverBudget: totalBudget > 0 && totalEstimated > totalBudget
		};
	})();

	// Radial gauge data for overall budget health
	const gaugeData = stats ? [{
		name: 'Budget Used',
		value: Math.min(stats.percentageUsed, 100),
		fill: stats.isOverBudget ? '#EF4444' : stats.percentageUsed > 80 ? '#F59E0B' : '#10B981',
	}] : [];

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

	if (!trip || !budgetData) {
		return (
			<div className="text-center py-12">
				<h3 className="text-lg font-medium text-gray-900 mb-2">No Budget Data</h3>
				<Link to={`/trips/${tripId}`} className="btn-secondary inline-flex items-center"><ArrowLeft className="h-4 w-4 mr-2" />Back to Trip</Link>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
				<div className="flex items-center space-x-4">
					<Link to={`/trips/${tripId}`} className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"><ArrowLeft className="h-5 w-5" /></Link>
					<div>
						<h1 className="text-2xl font-bold text-gray-900">Budget & Cost Estimator</h1>
						<p className="text-gray-600">{trip.name} • {budgetData.tripDays} days</p>
						{budgetData.isEstimate && (
							<span className="inline-flex items-center mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
								<Target className="h-3 w-3 mr-1" /> Dynamic Estimate
							</span>
						)}
					</div>
				</div>
				<div className="flex items-center flex-wrap gap-2">
					<button
						onClick={handleGenerateAIBudget}
						disabled={aiGenerating}
						className="btn-primary inline-flex items-center text-sm whitespace-nowrap"
						title="Use Gemini AI to estimate budget and category breakdown"
					>
						<Sparkles className="h-4 w-4 mr-2" />
						{aiGenerating ? 'Estimating with Gemini...' : 'AI Budget Estimate'}
					</button>
					<button onClick={() => setEditModalOpen(true)} className="btn-secondary inline-flex items-center whitespace-nowrap"><Edit className="h-4 w-4 mr-2" />Set Budget</button>
				</div>
			</div>

			{/* Travel Style & Group Size Selector */}
			<div className="card">
				<div className="card-body">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">Travel Style</label>
							<div className="grid grid-cols-3 gap-2">
								{Object.entries(STYLE_LABELS).map(([key, { label, emoji, desc }]) => (
									<button
										key={key}
										onClick={() => handleStyleChange(key)}
										className={`p-3 rounded-lg border-2 text-center transition-all duration-200 ${travelStyle === key
											? 'border-primary-500 bg-primary-50 shadow-sm'
											: 'border-gray-200 hover:border-gray-300 bg-white'
										}`}
									>
										<div className="text-2xl mb-1">{emoji}</div>
										<div className={`text-sm font-medium ${travelStyle === key ? 'text-primary-700' : 'text-gray-700'}`}>{label}</div>
										<div className="text-xs text-gray-500 mt-0.5 hidden md:block">{desc}</div>
									</button>
								))}
							</div>
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">Group Size</label>
							<div className="flex items-center space-x-3">
								<Users className="h-5 w-5 text-gray-400" />
								<input
									type="number"
									min="1"
									max="20"
									value={groupSize}
									onChange={(e) => handleGroupSizeChange(e.target.value)}
									className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
								/>
								<span className="text-sm text-gray-600">traveler{groupSize > 1 ? 's' : ''}</span>
							</div>
							<p className="text-xs text-gray-500 mt-2">
								Costs scale with group size. Shared expenses like accommodation are applied per-person.
							</p>
						</div>
					</div>
				</div>
			</div>

			{/* KPI Cards */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
				<div className="card">
					<div className="card-body flex items-center">
						<div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
							<Wallet className="h-6 w-6 text-blue-600" />
						</div>
						<div className="ml-3">
							<p className="text-sm text-gray-500">Your Budget</p>
							<p className="text-lg font-semibold">{stats?.totalBudget > 0 ? formatCurrency(stats.totalBudget, budgetData.currency) : 'Not set'}</p>
							{stats?.totalBudget === 0 && <p className="text-xs text-amber-600">Set a budget to track spending</p>}
						</div>
					</div>
				</div>
				<div className="card">
					<div className="card-body flex items-center">
						<div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${stats?.isOverBudget ? 'bg-red-100' : 'bg-emerald-100'}`}>
							{stats?.isOverBudget
								? <ArrowUpRight className="h-6 w-6 text-red-600" />
								: <TrendingUp className="h-6 w-6 text-emerald-600" />
							}
						</div>
						<div className="ml-3">
							<p className="text-sm text-gray-500">Estimated Cost</p>
							<p className={`text-lg font-semibold ${stats?.isOverBudget ? 'text-red-600' : 'text-gray-900'}`}>
								{formatCurrency(stats?.totalEstimated, budgetData.currency)}
							</p>
							{stats?.totalBudget > 0 && (
								<p className="text-xs text-gray-500">{stats.percentageUsed.toFixed(0)}% of budget</p>
							)}
						</div>
					</div>
				</div>
				<div className="card">
					<div className="card-body flex items-center">
						{stats?.remaining >= 0
							? <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0"><ArrowDownRight className="h-6 w-6 text-green-600" /></div>
							: <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0"><AlertTriangle className="h-6 w-6 text-red-600" /></div>
						}
						<div className="ml-3">
							<p className="text-sm text-gray-500">{stats?.remaining >= 0 ? 'Remaining' : 'Over Budget'}</p>
							<p className={`text-lg font-semibold ${stats?.remaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
								{stats?.totalBudget > 0 ? formatCurrency(Math.abs(stats.remaining), budgetData.currency) : '—'}
							</p>
						</div>
					</div>
				</div>
				<div className="card">
					<div className="card-body flex items-center">
						<div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
							<Calendar className="h-6 w-6 text-purple-600" />
						</div>
						<div className="ml-3">
							<p className="text-sm text-gray-500">Avg / Day</p>
							<p className="text-lg font-semibold">{formatCurrency(budgetData.averageDaily || stats?.averageDaily, budgetData.currency)}</p>
							<p className="text-xs text-gray-500">{budgetData.tripDays} days • {groupSize} person{groupSize > 1 ? 's' : ''}</p>
						</div>
					</div>
				</div>
			</div>

			{/* Alerts & Suggestions */}
			{budgetData.suggestions && budgetData.suggestions.length > 0 && (
				<div className="card">
					<div className="card-header cursor-pointer" onClick={() => setShowSuggestions(!showSuggestions)}>
						<div className="flex items-center justify-between">
							<div className="flex items-center space-x-2">
								<Zap className="h-5 w-5 text-amber-500" />
								<h3 className="text-lg font-semibold">Smart Suggestions</h3>
								<span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-medium">
									{budgetData.suggestions.length}
								</span>
							</div>
							{showSuggestions ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
						</div>
					</div>
					{showSuggestions && (
						<div className="card-body space-y-3">
							{budgetData.suggestions.map((s, i) => (
								<div key={i} className={`flex items-start space-x-3 p-3 rounded-lg border ${SUGGESTION_BG[s.type] || 'bg-gray-50 border-gray-200'}`}>
									<div className="flex-shrink-0 mt-0.5">{SUGGESTION_ICONS[s.type] || <Info className="h-5 w-5 text-gray-400" />}</div>
									<div className="flex-1 min-w-0">
										<p className="text-sm font-medium text-gray-900">{s.title}</p>
										<p className="text-sm text-gray-600 mt-0.5">{s.message}</p>
										{s.potentialSaving > 0 && (
											<p className="text-xs font-medium text-green-700 mt-1">
												💰 Potential saving: {formatCurrency(s.potentialSaving, budgetData.currency)}
											</p>
										)}
									</div>
								</div>
							))}
						</div>
					)}
				</div>
			)}

			{/* Per-destination breakdown */}
			{budgetData.destinationBreakdowns && budgetData.destinationBreakdowns.length > 0 && (
				<div className="card">
					<div className="card-header">
						<div className="flex items-center space-x-2">
							<MapPin className="h-5 w-5 text-primary-500" />
							<h3 className="text-lg font-semibold">Per-Destination Estimates</h3>
						</div>
					</div>
					<div className="card-body">
						<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
							{budgetData.destinationBreakdowns.map((dest, i) => (
								<div key={i} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
									<div className="flex items-center justify-between mb-3">
										<div>
											<h4 className="font-semibold text-gray-900">{dest.city}</h4>
											<p className="text-xs text-gray-500">{dest.country} • {dest.days} day{dest.days > 1 ? 's' : ''}</p>
										</div>
										<span className="text-lg font-bold text-primary-600">
											{formatCurrency(dest.subtotal, budgetData.currency)}
										</span>
									</div>
									<div className="space-y-2">
										{Object.entries(dest.dailyCosts).filter(([k]) => k !== 'dailyTotal').map(([cat, val]) => (
											<div key={cat} className="flex items-center justify-between text-sm">
												<span className="flex items-center space-x-2">
													<span>{CATEGORY_ICONS[cat] || '•'}</span>
													<span className="capitalize text-gray-600">{cat}</span>
												</span>
												<span className="text-gray-900 font-medium">{formatCurrency(val, budgetData.currency)}/day</span>
											</div>
										))}
									</div>
									<div className="mt-3 pt-2 border-t border-gray-100 flex justify-between text-sm">
										<span className="text-gray-500">Daily total</span>
										<span className="font-semibold">{formatCurrency(dest.dailyCosts.dailyTotal, budgetData.currency)}/day</span>
									</div>
								</div>
							))}
						</div>
					</div>
				</div>
			)}

			{/* View Mode Tabs */}
			<div className="border-b border-gray-200">
				<nav className="flex space-x-8">
					{[
						{ id: 'overview', name: 'Overview', icon: PieIcon },
						{ id: 'daily', name: 'Daily', icon: BarChart3 },
						{ id: 'category', name: 'Categories', icon: TrendingUp },
						{ id: 'tips', name: 'Saving Tips', icon: Lightbulb }
					].map(t => (
						<button key={t.id} onClick={() => setViewMode(t.id)} className={`${viewMode === t.id ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'} flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm`}>
							<t.icon className="h-4 w-4" /><span>{t.name}</span>
						</button>
					))}
				</nav>
			</div>

			{/* Overview Tab */}
			{viewMode === 'overview' && (
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
					<div className="card">
						<div className="card-header"><h3 className="text-lg font-semibold">Spending by Category</h3></div>
						<div className="card-body">
							{pieChartData.length ? (
								<ResponsiveContainer width="100%" height={300}>
									<RechartsPieChart>
										<Pie data={pieChartData} dataKey="value" cx="50%" cy="50%" outerRadius={90} innerRadius={50} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
											<>{pieChartData.map((d, i) => <Cell key={i} fill={d.color} />)}</>
										</Pie>
										<Tooltip formatter={(v) => formatCurrency(v, budgetData.currency)} />
									</RechartsPieChart>
								</ResponsiveContainer>
							) : (
								<div className="h-60 flex items-center justify-center text-gray-500">No data</div>
							)}
						</div>
					</div>

					<div className="card">
						<div className="card-header"><h3 className="text-lg font-semibold">Category Breakdown</h3></div>
						<div className="card-body space-y-4">
							{Object.entries(budgetData.breakdown).map(([cat, amt]) => {
								const pct = budgetData.total ? (amt / budgetData.total) * 100 : 0;
								return (
									<div key={cat}>
										<div className="flex items-center justify-between mb-1">
											<div className="flex items-center space-x-3">
												<span className="text-lg">{CATEGORY_ICONS[cat]}</span>
												<span className="capitalize text-sm font-medium">{cat}</span>
											</div>
											<div className="text-right">
												<p className="text-sm font-semibold">{formatCurrency(amt, budgetData.currency)}</p>
												<p className="text-xs text-gray-500">{pct.toFixed(1)}%</p>
											</div>
										</div>
										<div className="w-full bg-gray-100 rounded-full h-2">
											<div
												className="h-2 rounded-full transition-all duration-500"
												style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: COLORS[cat] }}
											></div>
										</div>
									</div>
								);
							})}
						</div>
					</div>

					{/* Budget Health Gauge */}
					{stats?.totalBudget > 0 && (
						<div className="card lg:col-span-2">
							<div className="card-header"><h3 className="text-lg font-semibold">Budget Health</h3></div>
							<div className="card-body flex flex-col md:flex-row items-center justify-around">
								<div className="w-48 h-48">
									<ResponsiveContainer width="100%" height="100%">
										<RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="90%" barSize={14} data={gaugeData} startAngle={180} endAngle={0}>
											<RadialBar minAngle={15} background clockWise dataKey="value" />
										</RadialBarChart>
									</ResponsiveContainer>
									<div className="text-center -mt-16">
										<span className={`text-2xl font-bold ${stats.isOverBudget ? 'text-red-600' : stats.percentageUsed > 80 ? 'text-amber-600' : 'text-green-600'}`}>
											{stats.percentageUsed.toFixed(0)}%
										</span>
										<p className="text-xs text-gray-500 mt-1">of budget</p>
									</div>
								</div>
								<div className="space-y-3 mt-4 md:mt-0">
									<div className="flex items-center space-x-3">
										<div className={`w-3 h-3 rounded-full ${stats.isOverBudget ? 'bg-red-500' : stats.percentageUsed > 80 ? 'bg-amber-500' : 'bg-green-500'}`}></div>
										<span className="text-sm text-gray-700">
											{stats.isOverBudget
												? `Over budget by ${formatCurrency(Math.abs(stats.remaining), budgetData.currency)}`
												: stats.percentageUsed > 80
													? `Getting close — ${formatCurrency(stats.remaining, budgetData.currency)} remaining`
													: `Healthy — ${formatCurrency(stats.remaining, budgetData.currency)} remaining`
											}
										</span>
									</div>
									<div className="flex items-center space-x-3">
										<div className="w-3 h-3 rounded-full bg-blue-500"></div>
										<span className="text-sm text-gray-700">Avg {formatCurrency(stats.averageDaily, budgetData.currency)}/day</span>
									</div>
									<div className="flex items-center space-x-3">
										<div className="w-3 h-3 rounded-full bg-purple-500"></div>
										<span className="text-sm text-gray-700">{budgetData.activities} activities planned</span>
									</div>
									{budgetData.actualActivitySpend > 0 && (
										<div className="flex items-center space-x-3">
											<div className="w-3 h-3 rounded-full bg-amber-500"></div>
											<span className="text-sm text-gray-700">{formatCurrency(budgetData.actualActivitySpend, budgetData.currency)} in planned activity costs</span>
										</div>
									)}
								</div>
							</div>
						</div>
					)}
				</div>
			)}

			{/* Daily Tab */}
			{viewMode === 'daily' && (
				<div className="space-y-6">
					<div className="card">
						<div className="card-header"><h3 className="text-lg font-semibold">Daily Stacked Spend</h3></div>
						<div className="card-body">
							{dailyChartData.length ? (
								<ResponsiveContainer width="100%" height={380}>
									<BarChart data={dailyChartData}>
										<CartesianGrid strokeDasharray="3 3" />
										<XAxis dataKey="date" />
										<YAxis tickFormatter={(v) => formatCurrency(v, budgetData.currency)} />
										<Tooltip
											formatter={(v, n) => [formatCurrency(v, budgetData.currency), n]}
											labelFormatter={(label, payload) => {
												const dest = payload?.[0]?.payload?.destination;
												return dest ? `${label} — ${dest}` : label;
											}}
										/>
										<Legend />
										{['accommodation', 'transportation', 'activities', 'food', 'other'].map(k =>
											<Bar key={k} dataKey={k} stackId="a" fill={COLORS[k]} name={k.charAt(0).toUpperCase() + k.slice(1)} />
										)}
									</BarChart>
								</ResponsiveContainer>
							) : (
								<div className="h-60 flex items-center justify-center text-gray-500">No daily data</div>
							)}
						</div>
					</div>
					{dailyChartData.length > 0 && (
						<div className="card">
							<div className="card-header"><h3 className="text-lg font-semibold">Daily Trend</h3></div>
							<div className="card-body">
								<ResponsiveContainer width="100%" height={280}>
									<LineChart data={dailyChartData}>
										<CartesianGrid strokeDasharray="3 3" />
										<XAxis dataKey="date" />
										<YAxis tickFormatter={(v) => formatCurrency(v, budgetData.currency)} />
										<Tooltip formatter={(v) => formatCurrency(v, budgetData.currency)} />
										<Line type="monotone" dataKey="total" stroke="#8B5CF6" strokeWidth={2} dot={{ r: 4 }} />
									</LineChart>
								</ResponsiveContainer>
							</div>
						</div>
					)}

					{/* Daily Table */}
					{dailyChartData.length > 0 && (
						<div className="card">
							<div className="card-header"><h3 className="text-lg font-semibold">Day-by-Day Breakdown</h3></div>
							<div className="card-body overflow-x-auto">
								<table className="w-full text-sm">
									<thead>
										<tr className="border-b border-gray-200">
											<th className="text-left py-2 px-3 font-medium text-gray-600">Date</th>
											<th className="text-left py-2 px-3 font-medium text-gray-600">Destination</th>
											{Object.keys(CATEGORY_ICONS).map(cat => (
												<th key={cat} className="text-right py-2 px-3 font-medium text-gray-600">
													<span title={cat}>{CATEGORY_ICONS[cat]}</span>
												</th>
											))}
											<th className="text-right py-2 px-3 font-medium text-gray-600">Total</th>
										</tr>
									</thead>
									<tbody>
										{dailyChartData.map((d, i) => (
											<tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
												<td className="py-2 px-3 font-medium">{d.date}</td>
												<td className="py-2 px-3 text-gray-600">{d.destination}</td>
												{Object.keys(CATEGORY_ICONS).map(cat => (
													<td key={cat} className="text-right py-2 px-3">{formatCurrency(d[cat] || 0, budgetData.currency)}</td>
												))}
												<td className="text-right py-2 px-3 font-semibold">{formatCurrency(d.total, budgetData.currency)}</td>
											</tr>
										))}
									</tbody>
									<tfoot>
										<tr className="border-t-2 border-gray-300">
											<td className="py-2 px-3 font-bold" colSpan="2">Total</td>
											{Object.keys(CATEGORY_ICONS).map(cat => (
												<td key={cat} className="text-right py-2 px-3 font-bold">
													{formatCurrency(budgetData.breakdown[cat] || 0, budgetData.currency)}
												</td>
											))}
											<td className="text-right py-2 px-3 font-bold text-primary-600">
												{formatCurrency(budgetData.total, budgetData.currency)}
											</td>
										</tr>
									</tfoot>
								</table>
							</div>
						</div>
					)}
				</div>
			)}

			{/* Category Tab */}
			{viewMode === 'category' && (
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
					{Object.entries(budgetData.breakdown).map(([cat, amt]) => (
						<div key={cat} className="card">
							<div className="card-header flex items-center space-x-2">
								<span className="text-xl">{CATEGORY_ICONS[cat]}</span>
								<h3 className="text-lg font-semibold capitalize">{cat}</h3>
							</div>
							<div className="card-body text-center space-y-2">
								<p className="text-3xl font-bold" style={{ color: COLORS[cat] }}>
									{formatCurrency(amt, budgetData.currency)}
								</p>
								<p className="text-xs text-gray-500">{budgetData.total ? ((amt / budgetData.total) * 100).toFixed(1) : 0}% of total</p>
								<p className="text-xs text-gray-400">{formatCurrency(amt / budgetData.tripDays, budgetData.currency)} / day</p>
								{groupSize > 1 && (
									<p className="text-xs text-gray-400">
										{formatCurrency(amt / groupSize, budgetData.currency)} / person
									</p>
								)}
								{/* Mini progress bar */}
								<div className="w-full bg-gray-100 rounded-full h-2 mt-3">
									<div
										className="h-2 rounded-full"
										style={{ width: `${budgetData.total ? Math.min((amt / budgetData.total) * 100, 100) : 0}%`, backgroundColor: COLORS[cat] }}
									></div>
								</div>
							</div>
						</div>
					))}
				</div>
			)}

			{/* Saving Tips Tab */}
			{viewMode === 'tips' && (
				<div className="space-y-6">
					{budgetData.savingTips && budgetData.savingTips.length > 0 && (
						<div className="card">
							<div className="card-header">
								<div className="flex items-center space-x-2">
									<Lightbulb className="h-5 w-5 text-amber-500" />
									<h3 className="text-lg font-semibold">Money-Saving Tips</h3>
								</div>
							</div>
							<div className="card-body">
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									{budgetData.savingTips.map((tip, i) => (
										<div key={i} className="flex items-start space-x-3 p-4 rounded-lg bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-100">
											<span className="text-xl flex-shrink-0">💡</span>
											<p className="text-sm text-gray-700">{tip}</p>
										</div>
									))}
								</div>
							</div>
						</div>
					)}

					{/* Budget comparison */}
					<div className="card">
						<div className="card-header"><h3 className="text-lg font-semibold">Style Comparison</h3></div>
						<div className="card-body">
							<p className="text-sm text-gray-600 mb-4">
								See how your trip cost changes with different travel styles (same destinations, same duration):
							</p>
							<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
								{Object.entries(STYLE_LABELS).map(([key, { label, emoji, desc }]) => {
									// Quick estimate: multiply current by ratio
									const ratio = key === 'budget' ? 0.55 : key === 'luxury' ? 2.2 : 1.0;
									const currentRatio = travelStyle === 'budget' ? 0.55 : travelStyle === 'luxury' ? 2.2 : 1.0;
									const estimated = Math.round(budgetData.total * (ratio / currentRatio));
									const isCurrent = key === travelStyle;
									return (
										<div key={key} className={`p-4 rounded-lg border-2 ${isCurrent ? 'border-primary-500 bg-primary-50' : 'border-gray-200'}`}>
											<div className="text-center">
												<span className="text-3xl">{emoji}</span>
												<h4 className="text-sm font-semibold mt-2">{label}</h4>
												<p className="text-2xl font-bold mt-1" style={{ color: isCurrent ? '#7c3aed' : '#1f2937' }}>
													{formatCurrency(estimated, budgetData.currency)}
												</p>
												<p className="text-xs text-gray-500 mt-1">{desc}</p>
												{isCurrent && (
													<span className="inline-block mt-2 px-2 py-0.5 text-xs font-medium rounded-full bg-primary-100 text-primary-700">Current</span>
												)}
											</div>
										</div>
									);
								})}
							</div>
						</div>
					</div>
				</div>
			)}

			{(overBudgetDays.length > 0 || stats?.isOverBudget) && (
				<div className="card border-red-200 bg-red-50">
					<div className="card-body flex">
						<AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
						<div className="ml-3 text-sm text-red-700 space-y-1">
							<p className="font-medium">Budget Alerts</p>
							{stats.isOverBudget && <p>Overall estimated cost exceeds budget by {formatCurrency(Math.abs(stats.remaining), budgetData.currency)}</p>}
							{overBudgetDays.length > 0 && <p>{overBudgetDays.length} day(s) exceed average daily budget</p>}
						</div>
					</div>
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
