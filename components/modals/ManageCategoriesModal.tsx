

import React, { useState, useEffect } from 'react';
import { TaskCategory } from '../../types';
import { AVAILABLE_COLORS } from '../../constants';

interface ManageCategoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: TaskCategory[];
  setCategories: React.Dispatch<React.SetStateAction<TaskCategory[]>>;
}

type View = 'list' | 'add' | 'edit';

const ManageCategoriesModal: React.FC<ManageCategoriesModalProps> = ({
  isOpen,
  onClose,
  categories,
  setCategories,
}) => {
  const [view, setView] = useState<View>('list');
  const [currentCategory, setCurrentCategory] = useState<TaskCategory | null>(null);
  const [title, setTitle] = useState('');
  const [color, setColor] = useState(AVAILABLE_COLORS[0].class);

  useEffect(() => {
    // Reset form when modal is closed or view changes
    if (!isOpen || view === 'list') {
      setTitle('');
      setColor(AVAILABLE_COLORS[0].class);
      setCurrentCategory(null);
    }
  }, [isOpen, view]);

  const handleEditClick = (category: TaskCategory) => {
    setCurrentCategory(category);
    setTitle(category.title);
    setColor(category.color);
    setView('edit');
  };

  const handleAddClick = () => {
    setCurrentCategory(null);
    setTitle('');
    setColor(AVAILABLE_COLORS[0].class);
    setView('add');
  };

  const handleDelete = (categoryId: string) => {
    if (window.confirm('Are you sure you want to delete this category and all its tasks?')) {
      setCategories(prev => prev.filter(c => c.id !== categoryId));
    }
  };

  const handleSave = () => {
    if (!title.trim()) {
        alert("Title cannot be empty.");
        return;
    }

    if (view === 'edit' && currentCategory) {
      // Edit existing category
      setCategories(prev =>
        prev.map(c =>
          c.id === currentCategory.id ? { ...c, title: title.trim(), color } : c
        )
      );
    } else {
      // Add new category
      const newCategory: TaskCategory = {
        id: `cat-${Date.now()}`,
        title: title.trim(),
        color,
        tasks: [], // New categories start with no tasks
      };
      setCategories(prev => [...prev, newCategory]);
    }
    setView('list');
  };

  if (!isOpen) return null;

  const modalTitle = view === 'list' ? 'Manage Categories' : view === 'add' ? 'Add New Category' : 'Edit Category';

  return (
    <div
      className="fixed inset-0 bg-black/60 flex justify-center items-center z-[100] animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-white p-6 rounded-2xl shadow-lg max-w-sm w-11/12 relative animate-slideInUp flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-dark">{modalTitle}</h2>
            <button
                className="text-gray hover:text-dark"
                onClick={onClose}
                aria-label="Close"
            >
                <i className="fa-solid fa-xmark text-2xl"></i>
            </button>
        </div>

        {view === 'list' ? (
          <div className="space-y-3">
            <div className="max-h-80 overflow-y-auto pr-2 space-y-3">
                {categories.map(category => (
                <div key={category.id} className="flex items-center gap-3 p-3 bg-gray-light rounded-lg">
                    <span className={`w-6 h-6 rounded-md ${category.color} flex-shrink-0`}></span>
                    <p className="flex-grow font-semibold text-dark truncate">{category.title}</p>
                    <button onClick={() => handleEditClick(category)} className="p-2 text-gray hover:text-primary" aria-label={`Edit ${category.title}`}>
                        <i className="fa-solid fa-pencil text-xl"></i>
                    </button>
                    <button onClick={() => handleDelete(category.id)} className="p-2 text-gray hover:text-error" aria-label={`Delete ${category.title}`}>
                        <i className="fa-solid fa-trash text-xl"></i>
                    </button>
                </div>
                ))}
            </div>
            <button
              onClick={handleAddClick}
              className="w-full flex items-center justify-center gap-2 bg-primary text-white font-bold py-3 rounded-xl shadow-lg shadow-primary/30 transition-transform hover:scale-105 mt-4"
            >
              <i className="fa-solid fa-plus text-xl"></i>
              Add New Category
            </button>
          </div>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-6">
            <div>
                <label htmlFor="cat-title" className="block text-sm font-bold text-gray mb-2">Category Title</label>
                <input
                    id="cat-title"
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="e.g., Gaming Tasks"
                    className="w-full px-4 py-2 border border-gray-medium rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    required
                />
            </div>
            <div>
                <label className="block text-sm font-bold text-gray mb-2">Color</label>
                <div className="grid grid-cols-4 gap-3">
                {AVAILABLE_COLORS.map(c => (
                    <button
                        key={c.class}
                        type="button"
                        onClick={() => setColor(c.class)}
                        className={`h-10 rounded-lg ${c.class} transition-all ${color === c.class ? 'ring-2 ring-offset-2 ring-primary' : 'hover:scale-105'}`}
                        aria-label={`Select color ${c.name}`}
                    />
                ))}
                </div>
            </div>
            <div className="flex gap-4 mt-4">
              <button
                type="button"
                onClick={() => setView('list')}
                className="w-full bg-gray-medium text-dark font-bold py-3 rounded-xl transition-colors hover:bg-gray-400/50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="w-full bg-success text-white font-bold py-3 rounded-xl shadow-lg shadow-success/30 transition-transform hover:scale-105"
              >
                Save
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ManageCategoriesModal;