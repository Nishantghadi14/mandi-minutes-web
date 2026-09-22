import { useState, useMemo } from 'react';
import { X, Search, Check, ShoppingBag, Plus, Sparkles } from 'lucide-react';
import { useData } from '../../context/DataContext';
import LazyImage from '../common/LazyImage';

// Curated Master Catalog items for quick selection by local kirana vendors
const MASTER_CATALOG = [
  { id: 'master-1', name: 'Gokul Toned Milk 500ml', brand: 'Gokul', category: 'cat-2', unit: '500 ml', defaultPrice: 28, mrp: 30, image: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400&q=80', description: 'Fresh Gokul Toned Milk delivered daily.' },
  { id: 'master-2', name: 'Amul Taaza Homogenised Milk', brand: 'Amul', category: 'cat-2', unit: '1 L', defaultPrice: 72, mrp: 75, image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&q=80', description: 'Pasteurised pasteurized milk with 3% fat.' },
  { id: 'master-3', name: 'Fresh Red Tomatoes', brand: 'Local Farm', category: 'cat-1', unit: '1 kg', defaultPrice: 38, mrp: 45, image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400&q=80', description: 'Ripe, farm-fresh red tomatoes.' },
  { id: 'master-4', name: 'Fresh Onions (Pyaz)', brand: 'Local Farm', category: 'cat-1', unit: '1 kg', defaultPrice: 32, mrp: 40, image: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=400&q=80', description: 'Fresh Nashik onions for daily cooking.' },
  { id: 'master-5', name: 'Fresh Potatoes (Aloo)', brand: 'Local Farm', category: 'cat-1', unit: '1 kg', defaultPrice: 28, mrp: 35, image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400&q=80', description: 'High-quality cooking potatoes.' },
  { id: 'master-6', name: 'Aashirvaad Shudh Chakki Atta', brand: 'Aashirvaad', category: 'cat-3', unit: '5 kg', defaultPrice: 245, mrp: 275, image: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400&q=80', description: '100% pure whole wheat flour.' },
  { id: 'master-7', name: 'Fortune Sunlite Sunflower Oil', brand: 'Fortune', category: 'cat-4', unit: '1 L pouch', defaultPrice: 135, mrp: 155, image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&q=80', description: 'Refined sunflower cooking oil.' },
  { id: 'master-8', name: 'Tata Salt Vacuum Evaporated', brand: 'Tata', category: 'cat-4', unit: '1 kg', defaultPrice: 28, mrp: 30, image: 'https://images.unsplash.com/photo-1518110168401-f28404f6cd8a?w=400&q=80', description: 'Iodized salt for everyday cooking.' },
  { id: 'master-9', name: 'Fortune Premium Kachi Ghani Mustard Oil', brand: 'Fortune', category: 'cat-4', unit: '1 L', defaultPrice: 155, mrp: 175, image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&q=80', description: 'Pure mustard oil rich in natural aroma.' },
  { id: 'master-10', name: 'Toor Dal (Arhar Dal) Premium', brand: 'Local Brand', category: 'cat-3', unit: '1 kg', defaultPrice: 165, mrp: 185, image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&q=80', description: 'Unpolished protein-rich Toor dal.' },
  { id: 'master-11', name: 'Maggi 2-Minute Masala Noodles', brand: 'Nestle', category: 'cat-5', unit: '4 Pack (280g)', defaultPrice: 56, mrp: 60, image: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?w=400&q=80', description: 'India favorite instant noodles.' },
  { id: 'master-12', name: 'Amul Butter Pasteurized', brand: 'Amul', category: 'cat-2', unit: '100g', defaultPrice: 58, mrp: 60, image: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=400&q=80', description: 'Utterly butterly delicious Amul butter.' },
];

export default function MasterCatalogModal({ storeId, onClose, onSaveBatch }) {
  const { categories } = useData();
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('all');
  const [selectedItems, setSelectedItems] = useState({}); // { [masterId]: { price, stock, checked } }
  const [submitting, setSubmitting] = useState(false);

  const filteredCatalog = useMemo(() => {
    return MASTER_CATALOG.filter(item => {
      const matchSearch = !search || item.name.toLowerCase().includes(search.toLowerCase()) || item.brand.toLowerCase().includes(search.toLowerCase());
      const matchCat = selectedCat === 'all' || item.category === selectedCat;
      return matchSearch && matchCat;
    });
  }, [search, selectedCat]);

  const toggleSelect = (item) => {
    setSelectedItems(prev => {
      const current = prev[item.id];
      if (current?.checked) {
        const copy = { ...prev };
        delete copy[item.id];
        return copy;
      } else {
        return {
          ...prev,
          [item.id]: {
            checked: true,
            price: item.defaultPrice,
            stock: 30,
            item,
          }
        };
      }
    });
  };

  const updatePrice = (itemId, val) => {
    setSelectedItems(prev => ({
      ...prev,
      [itemId]: {
        ...(prev[itemId] || {}),
        price: parseFloat(val) || 0
      }
    }));
  };

  const updateStock = (itemId, val) => {
    setSelectedItems(prev => ({
      ...prev,
      [itemId]: {
        ...(prev[itemId] || {}),
        stock: parseInt(val, 10) || 0
      }
    }));
  };

  const handleAddSelected = async () => {
    const listToSave = Object.values(selectedItems)
      .filter(entry => entry.checked && entry.price > 0)
      .map(entry => ({
        name: entry.item.name,
        brand: entry.item.brand,
        category: entry.item.category,
        price: entry.price,
        mrp: entry.item.mrp || Math.round(entry.price * 1.15),
        unit: entry.item.unit,
        stock: entry.stock,
        isAvailable: entry.stock > 0,
        image: entry.item.image,
        description: entry.item.description,
        storeId,
      }));

    if (listToSave.length === 0) return;

    setSubmitting(true);
    try {
      await onSaveBatch(listToSave);
      onClose();
    } catch (err) {
      console.error('Batch save failed:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const selectedCount = Object.values(selectedItems).filter(i => i.checked).length;

  return (
    <div className="overlay flex items-center justify-center p-4 z-50">
      <div className="bg-mandi-card border border-mandi-border rounded-2xl p-6 w-full max-w-3xl animate-fade-in max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-mandi-border">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-mandi-green bg-opacity-15 flex items-center justify-center text-mandi-green">
              <Sparkles size={20} />
            </div>
            <div>
              <h2 className="text-mandi-text font-black text-lg">Browse Master Kirana Catalog</h2>
              <p className="text-mandi-muted text-xs">Select items you sell in your shop, set custom prices & stock, and add in bulk.</p>
            </div>
          </div>
          <button onClick={onClose} className="text-mandi-subtle hover:text-mandi-text p-1"><X size={20} /></button>
        </div>

        {/* Filter bar */}
        <div className="py-3 flex flex-col sm:flex-row gap-3 items-center">
          <div className="relative flex-1 w-full">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-mandi-subtle" />
            <input
              type="text"
              placeholder="Search master products (e.g. Milk, Atta, Oil)..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input-field pl-10 text-xs w-full"
            />
          </div>
          <select
            value={selectedCat}
            onChange={e => setSelectedCat(e.target.value)}
            className="input-field text-xs py-2 px-3 w-full sm:w-auto cursor-pointer"
          >
            <option value="all">All Master Categories</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
          </select>
        </div>

        {/* Product list grid */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 my-2">
          {filteredCatalog.length === 0 ? (
            <div className="p-8 text-center text-mandi-muted text-xs card">
              No master items found matching "{search}".
            </div>
          ) : (
            filteredCatalog.map(item => {
              const selectedState = selectedItems[item.id];
              const isChecked = Boolean(selectedState?.checked);

              return (
                <div
                  key={item.id}
                  className={`p-3 rounded-xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                    isChecked
                      ? 'border-mandi-green bg-mandi-green bg-opacity-10'
                      : 'border-mandi-border bg-mandi-surface hover:border-mandi-border-light'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={() => toggleSelect(item)}
                      className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all flex-shrink-0 ${
                        isChecked
                          ? 'bg-mandi-green border-mandi-green text-black'
                          : 'border-mandi-border bg-mandi-card hover:border-mandi-green'
                      }`}
                    >
                      {isChecked && <Check size={14} strokeWidth={3} />}
                    </button>

                    <LazyImage src={item.image} alt={item.name} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" containerClass="w-10 h-10 rounded-lg flex-shrink-0" />

                    <div className="min-w-0">
                      <p className="text-mandi-text font-bold text-xs truncate">{item.name}</p>
                      <p className="text-mandi-subtle text-[11px] truncate">{item.brand} • {item.unit} • MRP ₹{item.mrp}</p>
                    </div>
                  </div>

                  {/* Inline Price & Stock inputs when selected */}
                  {isChecked ? (
                    <div className="flex items-center gap-3 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-mandi-border">
                      <div className="flex items-center gap-1">
                        <span className="text-mandi-subtle text-xs">Price: ₹</span>
                        <input
                          type="number"
                          min="1"
                          value={selectedState.price}
                          onChange={e => updatePrice(item.id, e.target.value)}
                          className="w-16 input-field py-1 px-2 text-xs font-bold text-mandi-green"
                        />
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-mandi-subtle text-xs">Stock:</span>
                        <input
                          type="number"
                          min="1"
                          value={selectedState.stock}
                          onChange={e => updateStock(item.id, e.target.value)}
                          className="w-14 input-field py-1 px-2 text-xs font-bold text-mandi-text"
                        />
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => toggleSelect(item)}
                      className="btn-outline py-1 px-3 text-xs flex items-center gap-1 text-mandi-green border-mandi-green border-opacity-40 hover:bg-mandi-green hover:text-black font-semibold self-end sm:self-auto"
                    >
                      <Plus size={13} /> Select Item
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer actions */}
        <div className="pt-3 border-t border-mandi-border flex items-center justify-between gap-3">
          <span className="text-mandi-muted text-xs font-medium">
            {selectedCount} item{selectedCount === 1 ? '' : 's'} selected
          </span>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="btn-ghost py-2 px-4 text-xs">
              Cancel
            </button>
            <button
              type="button"
              disabled={selectedCount === 0 || submitting}
              onClick={handleAddSelected}
              className="btn-primary py-2 px-5 text-xs font-bold flex items-center gap-1.5 disabled:opacity-50"
            >
              <ShoppingBag size={14} />
              {submitting ? 'Adding Products...' : `Add ${selectedCount} Selected Items`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
