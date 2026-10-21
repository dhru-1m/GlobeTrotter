import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { cityAPI, imageAPI } from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { ArrowLeft, MapPin, Clock, Sparkles } from 'lucide-react';

const AttractionDetail = () => {
  const { cityName, attractionSlug } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [image, setImage] = useState(null);

  const attractionName = decodeURIComponent(attractionSlug.replace(/-/g, ' '));

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true); setError(null);
        const res = await cityAPI.getAttractionDetail(cityName, attractionName);
        if (!cancelled) {
          if (res.data?.success) setData(res.data.data); else setError(res.data?.message || 'Failed to load');
        }
        // image fetch
        const imgRes = await imageAPI.search(`${attractionName} ${cityName}`);
        if (!cancelled && imgRes.data?.success) setImage(imgRes.data.photo);
      } catch (e) {
        if (!cancelled) setError(e.response?.data?.message || e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [cityName, attractionName]);

  if (loading) return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>;
  if (error) return <div className="max-w-3xl mx-auto p-6"><p className="text-danger-600">{error}</p></div>;
  if (!data) return null;

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-5xl mx-auto">
        <button onClick={() => navigate(-1)} className="mb-6 inline-flex items-center text-sm text-gray-600 hover:text-gray-900">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </button>
        <div className="card p-6 mb-8">
          <div className="mb-6 rounded-md overflow-hidden relative">
            <img
              src={image?.url || 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1200&q=80'}
              alt={data.name}
              className="w-full h-80 object-cover"
            />
            {image?.credit && (
              <a href={image.credit.link || '#'} target="_blank" rel="noopener noreferrer" className="absolute bottom-0 left-0 right-0 bg-black/40 text-[11px] text-gray-100 px-3 py-1 flex justify-between">
                <span>{image.credit.name}</span><span className="opacity-70">{image.credit.sourceLabel || (image.source === 'pexels' ? 'Pexels' : 'Unsplash')}</span>
              </a>
            )}
          </div>
          <h1 className="text-4xl font-bold mb-2">{data.name}</h1>
          <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
            <span className="inline-flex items-center"><MapPin className="h-4 w-4 mr-1" />{data.city}</span>
            {data.bestTime && <span className="inline-flex items-center"><Clock className="h-4 w-4 mr-1" />Best Time: {data.bestTime}</span>}
            {data.estimatedVisitDuration && <span className="inline-flex items-center"><Clock className="h-4 w-4 mr-1" />Duration: {data.estimatedVisitDuration}</span>}
            {data.approximateCost?.amount != null && <span>Cost: {data.approximateCost.currency === 'INR' ? '₹' : '$'}{data.approximateCost.amount}</span>}
          </div>
          <p className="text-lg text-gray-700 mb-6">{data.summary}</p>
          {data.history && (
            <div className="mb-6">
              <h2 className="text-2xl font-semibold mb-2">History</h2>
              <p className="text-gray-700 whitespace-pre-line leading-relaxed">{data.history}</p>
            </div>
          )}
          {data.highlights?.length > 0 && (
            <div className="mb-6">
              <h2 className="text-2xl font-semibold mb-3">Highlights</h2>
              <div className="flex flex-wrap gap-2">
                {data.highlights.map((h,i) => <span key={i} className="badge badge-primary text-xs">{h}</span>)}
              </div>
            </div>
          )}
          {data.tips?.length > 0 && (
            <div className="mb-6">
              <h2 className="text-2xl font-semibold mb-3">Visitor Tips</h2>
              <ul className="list-disc ml-6 space-y-1 text-gray-700">
                {data.tips.map((t,i) => <li key={i}>{t}</li>)}
              </ul>
            </div>
          )}
          {data.funFacts?.length > 0 && (
            <div className="mb-6">
              <h2 className="text-2xl font-semibold mb-3 flex items-center"><Sparkles className="h-5 w-5 mr-2 text-secondary-500" />Fun Facts</h2>
              <ul className="list-disc ml-6 space-y-1 text-gray-700">
                {data.funFacts.map((f,i) => <li key={i}>{f}</li>)}
              </ul>
            </div>
          )}
          {data.nearby?.length > 0 && (
            <div className="mb-6">
              <h2 className="text-2xl font-semibold mb-3">Nearby Places</h2>
              <div className="flex flex-wrap gap-2">
                {data.nearby.map((n,i) => <span key={i} className="badge badge-secondary text-xs">{n}</span>)}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AttractionDetail;
