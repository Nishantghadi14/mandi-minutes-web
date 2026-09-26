import { useState, useEffect } from 'react';
import { X, Package, AlertCircle } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { validateProduct, sanitizeText } from '../../utils/validators';
import ImageUploadField from '../common/ImageUploadField';

export default function ProductModal({ product = null, storeId, onClose, onSave }) {
  const { categories } = useData();
  const [form, setForm] = useState({
    name: '',
    brand: '',
    category: categories[0]?.id || 'cat-1',
    price: '',
    mrp: '',
    discount: 0,
    unit: '1 kg',
    stock: 50,
    isAvailable: true,
    description: '',
    image: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (product) {
      setForm({ ...product, image: product.image || '' });
    }
  }, [product]);

  const handleChange = (k, v) => {
    setForm(f => ({ ...f, [k]: v }));
    if (errors[k]) setErrors(e => ({ ...e, [k]: null }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validation = validateProduct(form);

    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    const priceNum = validation.sanitized.price;
    const mrpNum = Number(form.mrp) || priceNum;
    const discountPct = mrpNum > priceNum ? Math.round(((mrpNum - priceNum) / mrpNum) * 100) : 0;

    onSave({
      ...validation.sanitized,
      storeId,
      mrp: mrpNum,
      discount: discountPct,
      description: sanitizeText(form.description, 500),
    });
  };

  return (
    <div className="overlay flex items-center justify-center p-4 z-50">
      <div className="bg-mandi-card border border-mandi-border rounded-2xl p-6 w-full max-w-lg animate-fade-in max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Package size={20} className="text-mandi-green" />
            <h2 className="text-mandi-text font-bold text-lg">{product ? 'Edit Product' : 'Add New Product'}</h2>
          </div>
          <button onClick={onClose} className="text-mandi-subtle hover:text-mandi-text"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-mandi-muted text-xs font-medium mb-1">Product Name *</label>
            <input 
              required 
              value={form.name} 
              onChange={e => handleChange('name', e.target.value)} 
              placeholder="e.g. Fresh Red Tomatoes" 
              className={`input-field text-sm ${errors.name ? 'border-red-500' : ''}`} 
            />
            {errors.name && <p className="text-red-400 text-xs mt-1 flex items-center gap-1"><AlertCircle size={12} />{errors.name}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-mandi-muted text-xs font-medium mb-1">Brand</label>
              <input 
                value={form.brand} 
                onChange={e => handleChange('brand', e.target.value)} 
                placeholder="e.g. Local Farm / Amul" 
                className="input-field text-sm" 
              />
            </div>
            <div>
              <label className="block text-mandi-muted text-xs font-medium mb-1">Category *</label>
              <select 
                value={form.category} 
                onChange={e => handleChange('category', e.target.value)} 
                className="input-field text-sm cursor-pointer"
              >
                {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-mandi-muted text-xs font-medium mb-1">Selling Price (₹) *</label>
              <input 
                type="number" 
                required 
                min="1" 
                step="0.5" 
                value={form.price} 
                onChange={e => handleChange('price', e.target.value)} 
                placeholder="40" 
                className={`input-field text-sm ${errors.price ? 'border-red-500' : ''}`} 
              />
              {errors.price && <p className="text-red-400 text-xs mt-1">{errors.price}</p>}
            </div>
            <div>
              <label className="block text-mandi-muted text-xs font-medium mb-1">MRP (₹)</label>
              <input 
                type="number" 
                min="1" 
                step="0.5" 
                value={form.mrp} 
                onChange={e => handleChange('mrp', e.target.value)} 
                placeholder="50" 
                className="input-field text-sm" 
              />
            </div>
            <div>
              <label className="block text-mandi-muted text-xs font-medium mb-1">Unit / Variant *</label>
              <input 
                required 
                value={form.unit} 
                onChange={e => handleChange('unit', e.target.value)} 
                placeholder="500g / 1 Litre" 
                className={`input-field text-sm ${errors.unit ? 'border-red-500' : ''}`} 
              />
              {errors.unit && <p className="text-red-400 text-xs mt-1">{errors.unit}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-mandi-muted text-xs font-medium mb-1">Stock Quantity *</label>
              <input 
                type="number" 
                required 
                min="0" 
                value={form.stock} 
                onChange={e => handleChange('stock', e.target.value)} 
                className={`input-field text-sm ${errors.stock ? 'border-red-500' : ''}`} 
              />
              {errors.stock && <p className="text-red-400 text-xs mt-1">{errors.stock}</p>}
            </div>
            <div>
              <label className="block text-mandi-muted text-xs font-medium mb-1">Status</label>
              <select 
                value={form.isAvailable} 
                onChange={e => handleChange('isAvailable', e.target.value === 'true')} 
                className="input-field text-sm cursor-pointer"
              >
                <option value="true">In Stock</option>
                <option value="false">Out of Stock</option>
              </select>
            </div>
          </div>

          <div>
            <ImageUploadField
              label="Product Picture"
              value={form.image}
              onChange={val => handleChange('image', val)}
              aspectRatio="square"
              recommendedText="400×400px (1:1)"
              placeholderText="Image not available"
            />
            <div className="mt-3">
              <span className="text-[11px] text-mandi-subtle block mb-1 font-medium">Quick Select Preset Product Image:</span>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {[
                  { label: 'Milk/Dairy', url: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400&q=80' },
                  { label: 'Tomatoes', url: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400&q=80' },
                  { label: 'Onions', url: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=400&q=80' },
                  { label: 'Atta/Flour', url: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400&q=80' },
                  { label: 'Oil', url: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&q=80' },
                  { label: 'Pulses/Dal', url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&q=80' },
                  { label: 'Snacks', url: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?w=400&q=80' },
                ].map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleChange('image', preset.url)}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] border whitespace-nowrap transition-all ${
                      form.image === preset.url
                        ? 'border-mandi-green bg-mandi-green bg-opacity-20 text-mandi-green font-bold'
                        : 'border-mandi-border bg-mandi-surface text-mandi-muted hover:border-mandi-subtle'
                    }`}
                  >
                    <img src={preset.url} alt={preset.label} className="w-4 h-4 rounded object-cover" />
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-mandi-muted text-xs font-medium mb-1">Description</label>
            <textarea 
              rows={2} 
              value={form.description} 
              onChange={e => handleChange('description', e.target.value)} 
              placeholder="Brief product description..." 
              className="input-field text-sm w-full" 
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button type="submit" className="btn-primary flex-1 py-2.5 text-sm">{product ? 'Update Product' : 'Add Product'}</button>
            <button type="button" onClick={onClose} className="btn-ghost py-2.5 text-sm">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
