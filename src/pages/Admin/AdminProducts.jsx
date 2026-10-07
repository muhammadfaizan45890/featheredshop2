import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import axios from 'axios';
import DOMPurify from 'dompurify';
import { motion, AnimatePresence } from 'framer-motion';
import API from '../../utils/api';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import Blockquote from '@tiptap/extension-blockquote';
import CodeBlock from '@tiptap/extension-code-block';
import HorizontalRule from '@tiptap/extension-horizontal-rule';
import Strike from '@tiptap/extension-strike';
import TextAlign from '@tiptap/extension-text-align';
import Heading from '@tiptap/extension-heading';
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiSearch,
  FiX,
  FiImage,
  FiChevronLeft,
  FiChevronRight,
  FiRefreshCw,
  FiBold,
  FiItalic,
  FiUnderline,
  FiList,
  FiLink as FiLinkIcon,
  FiImage as FiImageIcon,
  FiType,
  FiGrid,
  FiList as FiListView,
  FiMaximize2,
  FiMinimize2,
  FiFilter,
  FiAlertTriangle,
  FiAlignLeft,
  FiAlignCenter,
  FiAlignRight,
  FiAlignJustify,
  FiCornerDownRight,
  FiCode,
  FiMinus,
  FiRotateCcw,
  FiRotateCw,
  FiSlash as FiStrikethrough,
  FiStar,
  FiEye,
  FiEyeOff,
  FiPackage,
  FiTag,
  FiCopy,
  FiCheck,
} from 'react-icons/fi';

/* ════════════════════════════════════════════════════════════
   Enums — mirror the backend model
   ════════════════════════════════════════════════════════════ */
const CATEGORIES = ['Men', 'Women', 'Unisex', 'Kids'];
const CONDITIONS = ['Good', 'Very Good', 'Excellent', 'Premium', 'Premium Plus'];
const BRANDS = [
  'Adidas', 'ASICS', 'Birkenstock', 'Brooks', 'Clarks', 'Columbia Sportswear',
  'Converse', 'Crocs', 'Dr. Martens', 'FILA', 'Geox', 'Gucci', 'HOKA',
  'Jimmy Choo', 'Louis Vuitton', 'Merrell', 'Mizuno', 'New Balance', 'Nike',
  'Prada', 'PUMA', 'Reebok', 'Saucony', 'Skechers', 'The North Face',
  'Timberland', 'TOMS', 'Under Armour', 'Zara', 'Others',
];
const APPAREL_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'One Size'];
const SHOE_SIZES = ['36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46'];

/* ════════════════════════════════════════════════════════════
   API instance
   ════════════════════════════════════════════════════════════ */
const getApiInstance = () => {
  let instance;
  if (API && typeof API.get === 'function') {
    instance = API;
  } else {
    instance = axios.create({
      baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!instance.__adminProductsAttached) {
    instance.interceptors.request.use(
      (config) => {
        try {
          const token = localStorage.getItem('accessToken');
          if (token) config.headers.Authorization = `Bearer ${token}`;
        } catch {}
        return config;
      },
      (error) => Promise.reject(error)
    );
    instance.__adminProductsAttached = true;
  }

  return instance;
};

const api = getApiInstance();

/* ════════════════════════════════════════════════════════════
   Helpers
   ════════════════════════════════════════════════════════════ */
const EMPTY_FORM = {
  title: '',
  sku: '',              // ✅ NEW
  shortDescription: '',
  longDescription: '',
  category: 'Men',
  condition: 'Excellent',
  brand: 'Nike',
  sizes: [],
  images: [],
  regularPrice: '',
  salePrice: '',
  isPublished: true,
  isFeatured: false,
  inStock: true,
  stockQuantity: 0,
};

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];
const URL_REGEX = /^https?:\/\/.+\..+/i;
const SKU_REGEX = /^[A-Z0-9-]{3,40}$/;

const sanitizeHtml = (html) =>
  DOMPurify.sanitize(html || '', {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 's', 'strike', 'a', 'ul', 'ol', 'li',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'img',
      'code', 'pre', 'span', 'hr', 'div',
    ],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'target', 'rel', 'class', 'style'],
    ALLOW_DATA_ATTR: false,
  });

const getContentStats = (html) => {
  if (!html) return { words: 0, chars: 0, paragraphs: 0, readingTime: 0 };
  const temp = document.createElement('div');
  temp.innerHTML = sanitizeHtml(html);
  const text = temp.textContent || '';
  const chars = text.length;
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const paragraphs =
    temp.querySelectorAll('p, li, h1, h2, h3, h4, h5, h6, blockquote').length ||
    (text.trim() ? 1 : 0);
  const readingTime = words > 0 ? Math.max(1, Math.ceil(words / 200)) : 0;
  return { words, chars, paragraphs, readingTime };
};

const isEmptyDescription = (html) => {
  if (!html) return true;
  const stripped = html.replace(/<[^>]*>/g, '').trim();
  return stripped === '';
};

const formatPKR = (value) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return 'Rs 0';
  return `Rs ${num.toLocaleString('en-PK')}`;
};

/* ✅ Client-side SKU generator (mirrors backend format: BRAND-CAT-XXXXX) */
const generateLocalSku = (brand, category) => {
  const tag = (s, n) =>
    String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, n) || 'GEN';
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `${tag(brand, 3)}-${tag(category, 3)}-${rand}`;
};

/* ════════════════════════════════════════════════════════════
   Validation
   ════════════════════════════════════════════════════════════ */
const validateProductForm = (form) => {
  const errors = {};

  const title = (form.title || '').trim();
  if (!title) errors.title = 'Title is required.';
  else if (title.length < 5) errors.title = 'Title should be at least 5 characters.';
  else if (title.length > 200) errors.title = 'Title should be under 200 characters.';

  /* ✅ SKU — optional (auto-generated server-side), but if provided must be valid */
  const sku = (form.sku || '').trim().toUpperCase();
  if (sku && !SKU_REGEX.test(sku)) {
    errors.sku = 'SKU must be 3–40 chars: A–Z, 0–9, and hyphens only.';
  }

  const short = (form.shortDescription || '').trim();
  if (!short) errors.shortDescription = 'Short description is required.';
  else if (short.length > 300)
    errors.shortDescription = 'Short description should be under 300 characters.';

  if (isEmptyDescription(form.longDescription)) {
    errors.longDescription = 'Long description is required.';
  }

  if (!CATEGORIES.includes(form.category)) errors.category = 'Please choose a valid category.';
  if (!CONDITIONS.includes(form.condition)) errors.condition = 'Please choose a valid condition.';
  if (!BRANDS.includes(form.brand)) errors.brand = 'Please choose a valid brand.';

  if (!form.sizes || form.sizes.length === 0) {
    errors.sizes = 'Please select at least one size.';
  } else {
    const allValid = form.sizes.every(
      (s) => APPAREL_SIZES.includes(s) || SHOE_SIZES.includes(s)
    );
    if (!allValid) errors.sizes = 'One or more selected sizes are invalid.';
  }

  if (!form.images || form.images.length === 0) {
    errors.images = 'At least one image is required.';
  } else {
    const bad = form.images.find((u) => !URL_REGEX.test(u));
    if (bad) errors.images = `That doesn't look like a valid image URL: ${bad}`;
  }

  const rp = Number(form.regularPrice);
  if (form.regularPrice === '' || form.regularPrice === null || form.regularPrice === undefined) {
    errors.regularPrice = 'Regular price is required.';
  } else if (!Number.isFinite(rp) || rp < 0) {
    errors.regularPrice = 'Regular price must be a non-negative number.';
  }

  const sp = form.salePrice === '' || form.salePrice === null ? 0 : Number(form.salePrice);
  if (!Number.isFinite(sp) || sp < 0) {
    errors.salePrice = 'Sale price must be a non-negative number.';
  } else if (sp > 0 && Number.isFinite(rp) && sp > rp) {
    errors.salePrice = 'Sale price cannot be greater than regular price.';
  }

  return errors;
};

/* ════════════════════════════════════════════════════════════
   Shared Tailwind class helpers (reference design tokens)
   ════════════════════════════════════════════════════════════ */
const INPUT_CLS =
  'w-full px-3.5 py-2.5 bg-neutral-100 dark:bg-neutral-800/60 border border-transparent focus:border-neutral-300 dark:focus:border-neutral-700 focus:bg-white dark:focus:bg-neutral-900 rounded-xl text-[13px] text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 transition-colors outline-none focus:outline-none focus-visible:outline-none';

const INPUT_ERR_CLS =
  'w-full px-3.5 py-2.5 bg-red-50/60 dark:bg-red-950/20 border border-red-300 dark:border-red-900/60 focus:border-red-500 rounded-xl text-[13px] text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 transition-colors outline-none focus:outline-none focus-visible:outline-none';

const LABEL_CLS = 'block text-[11px] uppercase tracking-wider font-semibold text-neutral-500 dark:text-neutral-400 mb-1.5';

/* ════════════════════════════════════════════════════════════
   Toolbar
   ════════════════════════════════════════════════════════════ */
const ToolbarButton = React.memo(({ onClick, isActive, icon: Icon, label }) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex items-center justify-center h-8 w-8 rounded-lg transition-colors outline-none focus:outline-none focus-visible:outline-none ${
      isActive
        ? 'bg-amber-400 text-amber-950'
        : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-neutral-100'
    }`}
    aria-label={label}
    title={label}
  >
    <Icon size={15} />
  </button>
));
ToolbarButton.displayName = 'ToolbarButton';

const EditorToolbar = ({ editor, onSetLink, onAddImage }) => {
  if (!editor || editor.isDestroyed) return null;

  return (
    <div className="flex flex-wrap items-center gap-0.5 p-1.5 bg-neutral-50 dark:bg-neutral-900/60 border-b border-neutral-200/80 dark:border-neutral-800 overflow-x-auto">
      <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')} icon={FiBold} label="Bold" />
      <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')} icon={FiItalic} label="Italic" />
      <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} isActive={editor.isActive('underline')} icon={FiUnderline} label="Underline" />
      <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} isActive={editor.isActive('strike')} icon={FiStrikethrough} label="Strikethrough" />
      <span className="w-px h-6 bg-neutral-200 dark:bg-neutral-700 mx-1 shrink-0" />

      <div className="relative inline-block">
        <select
          onChange={(e) => {
            const v = e.target.value;
            if (v === 'paragraph') editor.chain().focus().setParagraph().run();
            else if (v.startsWith('heading')) {
              const level = parseInt(v.split('-')[1], 10);
              editor.chain().focus().toggleHeading({ level }).run();
            }
          }}
          value={
            editor.isActive('heading', { level: 1 }) ? 'heading-1'
            : editor.isActive('heading', { level: 2 }) ? 'heading-2'
            : editor.isActive('heading', { level: 3 }) ? 'heading-3'
            : editor.isActive('heading', { level: 4 }) ? 'heading-4'
            : 'paragraph'
          }
          className="h-8 text-[12px] border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 px-2 py-0 focus:outline-none focus:border-amber-400 cursor-pointer"
        >
          <option value="paragraph">Normal</option>
          <option value="heading-1">Heading 1</option>
          <option value="heading-2">Heading 2</option>
          <option value="heading-3">Heading 3</option>
          <option value="heading-4">Heading 4</option>
        </select>
      </div>
      <span className="w-px h-6 bg-neutral-200 dark:bg-neutral-700 mx-1 shrink-0" />

      <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive('bulletList')} icon={FiList} label="Bullet list" />
      <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive('orderedList')} icon={FiList} label="Ordered list" />
      <span className="w-px h-6 bg-neutral-200 dark:bg-neutral-700 mx-1 shrink-0" />

      <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} isActive={editor.isActive('blockquote')} icon={FiCornerDownRight} label="Blockquote" />
      <ToolbarButton onClick={() => editor.chain().focus().toggleCodeBlock().run()} isActive={editor.isActive('codeBlock')} icon={FiCode} label="Code block" />
      <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()} isActive={false} icon={FiMinus} label="Horizontal rule" />
      <span className="w-px h-6 bg-neutral-200 dark:bg-neutral-700 mx-1 shrink-0" />

      <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('left').run()} isActive={editor.isActive({ textAlign: 'left' })} icon={FiAlignLeft} label="Align left" />
      <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('center').run()} isActive={editor.isActive({ textAlign: 'center' })} icon={FiAlignCenter} label="Align center" />
      <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('right').run()} isActive={editor.isActive({ textAlign: 'right' })} icon={FiAlignRight} label="Align right" />
      <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('justify').run()} isActive={editor.isActive({ textAlign: 'justify' })} icon={FiAlignJustify} label="Justify" />
      <span className="w-px h-6 bg-neutral-200 dark:bg-neutral-700 mx-1 shrink-0" />

      <ToolbarButton onClick={() => editor.chain().focus().undo().run()} isActive={false} icon={FiRotateCcw} label="Undo" />
      <ToolbarButton onClick={() => editor.chain().focus().redo().run()} isActive={false} icon={FiRotateCw} label="Redo" />
      <span className="w-px h-6 bg-neutral-200 dark:bg-neutral-700 mx-1 shrink-0" />

      <ToolbarButton onClick={onSetLink} isActive={editor.isActive('link')} icon={FiLinkIcon} label="Link" />
      <ToolbarButton onClick={onAddImage} isActive={false} icon={FiImageIcon} label="Image" />
      <span className="w-px h-6 bg-neutral-200 dark:bg-neutral-700 mx-1 shrink-0" />

      <ToolbarButton onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()} isActive={false} icon={FiType} label="Clear formatting" />
    </div>
  );
};

/* ════════════════════════════════════════════════════════════
   Presentational components
   ════════════════════════════════════════════════════════════ */
const StatusBadge = ({ isPublished }) => (
  <span
    className={`absolute top-2 right-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-semibold backdrop-blur-md ${
      isPublished
        ? 'bg-emerald-500/90 text-white'
        : 'bg-neutral-900/80 text-white'
    }`}
  >
    <span className={`w-1.5 h-1.5 rounded-full ${isPublished ? 'bg-emerald-200' : 'bg-neutral-400'} animate-pulse`} />
    {isPublished ? 'Published' : 'Draft'}
  </span>
);

const ProductThumbnail = ({ images, title }) => (
  <div className="relative aspect-square overflow-hidden bg-neutral-100 dark:bg-neutral-800 shrink-0">
    {images && images.length > 0 ? (
      <img
        src={images[0]}
        alt={title}
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        loading="lazy"
        onError={(e) => {
          e.target.style.display = 'none';
        }}
      />
    ) : (
      <div className="flex items-center justify-center h-full text-neutral-400">
        <FiImage size={28} />
      </div>
    )}
    {images && images.length > 1 && (
      <span className="absolute bottom-2 right-2 bg-neutral-900/80 text-white text-[10px] sm:text-[11px] px-2 py-0.5 rounded-full backdrop-blur-md font-semibold">
        +{images.length - 1}
      </span>
    )}
  </div>
);

const ProductCard = React.memo(({ product, onEdit, onDelete }) => {
  const rp = Number(product.regularPrice) || 0;
  const sp = Number(product.salePrice) || 0;
  const hasSale = sp > 0 && sp < rp;
  const discount = hasSale ? Math.round(((rp - sp) / rp) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="group relative bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 overflow-hidden flex flex-col hover:shadow-lg hover:border-neutral-300 dark:hover:border-neutral-700 transition-all duration-300"
    >
      <ProductThumbnail images={product.images} title={product.title} />
      <StatusBadge isPublished={product.isPublished} />

      {hasSale && (
        <span className="absolute top-2 left-2 px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-bold bg-red-500 text-white shadow-sm">
          −{discount}%
        </span>
      )}

      <div className="p-3 sm:p-4 flex-1 flex flex-col min-w-0">
        <div className="flex items-start justify-between gap-2">
          <span className="text-[10px] sm:text-[11px] font-semibold text-neutral-500 uppercase tracking-wider truncate">
            {product.brand} · {product.category}
          </span>
          <span className="text-[10px] text-neutral-400 shrink-0 tabular-nums">
            {new Date(product.createdAt).toLocaleDateString()}
          </span>
        </div>

        <h3 className="text-sm sm:text-[15px] font-bold mt-1.5 line-clamp-2 break-words text-neutral-900 dark:text-neutral-100">
          {product.title}
        </h3>

        {/* ✅ SKU line */}
        {product.sku && (
          <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-mono font-semibold text-neutral-400 dark:text-neutral-500">
            <FiTag size={10} strokeWidth={2.5} />
            {product.sku}
          </span>
        )}

        {product.shortDescription && (
          <p className="text-neutral-500 dark:text-neutral-400 text-xs sm:text-[13px] line-clamp-2 mt-1">
            {product.shortDescription}
          </p>
        )}

        <div className="mt-2.5 flex items-baseline gap-2">
          <span className="text-sm sm:text-base font-bold text-neutral-900 dark:text-neutral-100 tabular-nums">
            {formatPKR(hasSale ? sp : rp)}
          </span>
          {hasSale && (
            <span className="text-[11px] text-neutral-400 line-through tabular-nums">
              {formatPKR(rp)}
            </span>
          )}
        </div>

        <div className="mt-2 flex items-center gap-1.5 flex-wrap text-[10px] sm:text-[11px] text-neutral-500">
          <span className="px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 font-medium">
            {product.condition}
          </span>
          {product.sizes && product.sizes.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 font-medium truncate max-w-[150px]">
              {product.sizes.slice(0, 3).join(' · ')}
              {product.sizes.length > 3 ? ` +${product.sizes.length - 3}` : ''}
            </span>
          )}
        </div>

        <div className="mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between gap-2">
          <span className="text-[10px] text-neutral-400 truncate">
            by {product.authorName || 'Admin'}
          </span>
          <div className="flex gap-1 shrink-0">
            <button
              onClick={() => onEdit(product)}
              aria-label="Edit product"
              className="h-8 w-8 flex items-center justify-center text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors outline-none focus:outline-none focus-visible:outline-none"
            >
              <FiEdit2 size={14} />
            </button>
            <button
              onClick={() => onDelete(product)}
              aria-label="Delete product"
              className="h-8 w-8 flex items-center justify-center text-neutral-500 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors outline-none focus:outline-none focus-visible:outline-none"
            >
              <FiTrash2 size={14} />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
});
ProductCard.displayName = 'ProductCard';

const ProductsGrid = ({ products, onEdit, onDelete }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-5">
    {products.map((p) => (
      <ProductCard key={p._id} product={p} onEdit={onEdit} onDelete={onDelete} />
    ))}
  </div>
);

const ProductsTable = ({ products, onEdit, onDelete }) => (
  <div className="overflow-hidden border border-neutral-200/80 dark:border-neutral-800 rounded-2xl bg-white dark:bg-neutral-900">
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead className="bg-neutral-50 dark:bg-neutral-800/40 border-b border-neutral-100 dark:border-neutral-800">
          <tr>
            <th className="px-3 py-3 text-left text-[10px] uppercase tracking-wider font-bold text-neutral-400 w-16">Image</th>
            <th className="px-3 py-3 text-left text-[10px] uppercase tracking-wider font-bold text-neutral-400">Product</th>
            <th className="px-3 py-3 text-left text-[10px] uppercase tracking-wider font-bold text-neutral-400 hidden md:table-cell">SKU</th>
            <th className="px-3 py-3 text-left text-[10px] uppercase tracking-wider font-bold text-neutral-400 hidden sm:table-cell">Brand</th>
            <th className="px-3 py-3 text-left text-[10px] uppercase tracking-wider font-bold text-neutral-400 hidden md:table-cell">Category</th>
            <th className="px-3 py-3 text-left text-[10px] uppercase tracking-wider font-bold text-neutral-400">Price</th>
            <th className="px-3 py-3 text-left text-[10px] uppercase tracking-wider font-bold text-neutral-400">Status</th>
            <th className="px-3 py-3 text-right text-[10px] uppercase tracking-wider font-bold text-neutral-400">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
          {products.map((p) => {
            const rp = Number(p.regularPrice) || 0;
            const sp = Number(p.salePrice) || 0;
            const hasSale = sp > 0 && sp < rp;
            return (
              <tr key={p._id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors group">
                <td className="px-3 py-2.5">
                  <div className="h-11 w-11 rounded-xl overflow-hidden bg-neutral-100 dark:bg-neutral-800 shrink-0">
                    {p.images?.[0] ? (
                      <img
                        src={p.images[0]}
                        alt={p.title}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-neutral-400">
                        <FiImage size={14} />
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-3 py-2.5 max-w-[220px] sm:max-w-xs">
                  <p className="font-semibold text-[13px] text-neutral-900 dark:text-neutral-100 truncate">{p.title}</p>
                  <p className="text-[10px] text-neutral-400 sm:hidden truncate">
                    {p.brand} · {p.category}
                  </p>
                </td>
                {/* ✅ SKU column */}
                <td className="px-3 py-2.5 hidden md:table-cell">
                  {p.sku ? (
                    <span className="font-mono text-[11px] font-semibold text-neutral-600 dark:text-neutral-400">
                      {p.sku}
                    </span>
                  ) : (
                    <span className="text-[11px] text-neutral-400">—</span>
                  )}
                </td>
                <td className="px-3 py-2.5 text-[12px] text-neutral-600 dark:text-neutral-400 hidden sm:table-cell">{p.brand}</td>
                <td className="px-3 py-2.5 text-[12px] text-neutral-600 dark:text-neutral-400 hidden md:table-cell">{p.category}</td>
                <td className="px-3 py-2.5 whitespace-nowrap tabular-nums">
                  <span className="font-bold text-[13px] text-neutral-900 dark:text-neutral-100">
                    {formatPKR(hasSale ? sp : rp)}
                  </span>
                  {hasSale && (
                    <span className="block text-[10px] text-neutral-400 line-through">
                      {formatPKR(rp)}
                    </span>
                  )}
                </td>
                <td className="px-3 py-2.5">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-semibold whitespace-nowrap ${
                      p.isPublished
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${p.isPublished ? 'bg-emerald-500' : 'bg-neutral-400'} animate-pulse`} />
                    {p.isPublished ? 'Published' : 'Draft'}
                  </span>
                </td>
                <td className="px-3 py-2.5">
                  <div className="flex justify-end gap-1">
                    <button
                      onClick={() => onEdit(p)}
                      aria-label="Edit product"
                      className="h-8 w-8 flex items-center justify-center text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors outline-none focus:outline-none focus-visible:outline-none"
                    >
                      <FiEdit2 size={14} />
                    </button>
                    <button
                      onClick={() => onDelete(p)}
                      aria-label="Delete product"
                      className="h-8 w-8 flex items-center justify-center text-neutral-500 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors outline-none focus:outline-none focus-visible:outline-none"
                    >
                      <FiTrash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  </div>
);

const Pagination = ({ page, totalPages, onChange }) => {
  if (totalPages <= 1) return null;
  return (
    <div className="flex justify-center items-center gap-2 sm:gap-3 mt-6 sm:mt-8">
      <button
        onClick={() => onChange(Math.max(page - 1, 1))}
        disabled={page === 1}
        aria-label="Previous page"
        className="h-9 w-9 flex items-center justify-center rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/60 disabled:opacity-40 disabled:cursor-not-allowed transition-colors outline-none focus:outline-none focus-visible:outline-none"
      >
        <FiChevronLeft size={16} strokeWidth={2.5} />
      </button>
      <span className="text-[12px] font-semibold text-neutral-900 dark:text-neutral-100 tabular-nums px-3">
        {page} / {totalPages}
      </span>
      <button
        onClick={() => onChange(Math.min(page + 1, totalPages))}
        disabled={page === totalPages}
        aria-label="Next page"
        className="h-9 w-9 flex items-center justify-center rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/60 disabled:opacity-40 disabled:cursor-not-allowed transition-colors outline-none focus:outline-none focus-visible:outline-none"
      >
        <FiChevronRight size={16} strokeWidth={2.5} />
      </button>
    </div>
  );
};

const ViewToggle = ({ viewMode, onChange }) => (
  <div className="inline-flex items-center p-0.5 bg-neutral-100 dark:bg-neutral-800 rounded-full shrink-0">
    <button
      onClick={() => onChange('grid')}
      aria-label="Grid view"
      aria-pressed={viewMode === 'grid'}
      className={`h-8 w-8 flex items-center justify-center rounded-full transition-all outline-none focus:outline-none focus-visible:outline-none ${
        viewMode === 'grid'
          ? 'bg-white dark:bg-neutral-900 text-amber-600 dark:text-amber-400 shadow-sm'
          : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
      }`}
    >
      <FiGrid size={14} />
    </button>
    <button
      onClick={() => onChange('table')}
      aria-label="Table view"
      aria-pressed={viewMode === 'table'}
      className={`h-8 w-8 flex items-center justify-center rounded-full transition-all outline-none focus:outline-none focus-visible:outline-none ${
        viewMode === 'table'
          ? 'bg-white dark:bg-neutral-900 text-amber-600 dark:text-amber-400 shadow-sm'
          : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
      }`}
    >
      <FiListView size={14} />
    </button>
  </div>
);

const SELECT_CLS =
  'px-3.5 py-2.5 bg-neutral-100 dark:bg-neutral-800/60 border border-transparent focus:border-neutral-300 dark:focus:border-neutral-700 rounded-xl text-[13px] font-medium text-neutral-700 dark:text-neutral-300 outline-none focus:outline-none cursor-pointer';

const SearchFilterBar = ({
  searchInput,
  onSearchChange,
  category,
  onCategoryChange,
  brand,
  onBrandChange,
  condition,
  onConditionChange,
  onRefresh,
  pageSize,
  onPageSizeChange,
  viewMode,
  onViewModeChange,
  hasActiveFilters,
  onClearFilters,
  resultsLabel,
}) => (
  <div className="bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 rounded-2xl p-3 sm:p-4 mb-4 sm:mb-5 space-y-3">
    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
      <div className="flex-1 relative">
        <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" size={15} />
        <input
          type="text"
          placeholder="Search by title, SKU, brand…"
          value={searchInput}
          onChange={(e) => onSearchChange(e.target.value)}
          className={INPUT_CLS + ' pl-10'}
          aria-label="Search products"
        />
      </div>
      <div className="flex gap-2 flex-wrap sm:flex-nowrap">
        <select value={category} onChange={(e) => onCategoryChange(e.target.value)} className={SELECT_CLS + ' flex-1 sm:flex-none min-w-0 sm:min-w-[120px]'} aria-label="Category filter">
          <option value="All">All Categories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={brand} onChange={(e) => onBrandChange(e.target.value)} className={SELECT_CLS + ' flex-1 sm:flex-none min-w-0 sm:min-w-[130px]'} aria-label="Brand filter">
          <option value="All">All Brands</option>
          {BRANDS.map((b) => <option key={b} value={b}>{b}</option>)}
        </select>
        <select value={condition} onChange={(e) => onConditionChange(e.target.value)} className={SELECT_CLS + ' flex-1 sm:flex-none min-w-0 sm:min-w-[130px]'} aria-label="Condition filter">
          <option value="All">All Conditions</option>
          {CONDITIONS.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          aria-label="Products per page"
          className={SELECT_CLS + ' shrink-0'}
        >
          {PAGE_SIZE_OPTIONS.map((n) => <option key={n} value={n}>{n} / page</option>)}
        </select>
        <ViewToggle viewMode={viewMode} onChange={onViewModeChange} />
        <button
          onClick={onRefresh}
          aria-label="Refresh products"
          className="px-3.5 py-2.5 bg-neutral-100 dark:bg-neutral-800/60 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-xl flex items-center gap-2 text-[13px] font-semibold text-neutral-700 dark:text-neutral-300 transition-colors shrink-0 outline-none focus:outline-none focus-visible:outline-none"
        >
          <FiRefreshCw size={14} strokeWidth={2.5} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>
    </div>
    <div className="flex items-center justify-between gap-2 flex-wrap">
      <p className="text-[11px] text-neutral-500 dark:text-neutral-400">{resultsLabel}</p>
      {hasActiveFilters && (
        <button
          onClick={onClearFilters}
          className="flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400 hover:underline underline-offset-2 outline-none focus:outline-none focus-visible:outline-none"
        >
          <FiFilter size={11} strokeWidth={2.5} /> Clear filters
        </button>
      )}
    </div>
  </div>
);

const ImageUrlList = ({ images, onRemove }) => {
  if (!images.length) return null;
  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {images.map((url, idx) => (
        <div key={idx} className="relative group">
          <img
            src={url}
            alt=""
            className="w-14 h-14 sm:w-16 sm:h-16 object-cover rounded-xl border border-neutral-200 dark:border-neutral-800"
            onError={(e) => {
              e.target.style.opacity = 0.4;
            }}
          />
          <button
            type="button"
            onClick={() => onRemove(idx)}
            aria-label="Remove image"
            className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600 transition-colors shadow-sm outline-none focus:outline-none focus-visible:outline-none"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
};

const ImageUrlInput = ({ imageInput, setImageInput, images, onAdd, onRemove, error }) => (
  <div>
    <label className={LABEL_CLS}>Images (URLs) *</label>
    <div className="flex flex-col xs:flex-row gap-2">
      <input
        type="url"
        value={imageInput}
        onChange={(e) => setImageInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            onAdd();
          }
        }}
        placeholder="Enter image URL"
        className={error ? INPUT_ERR_CLS : INPUT_CLS}
      />
      <button
        type="button"
        onClick={onAdd}
        disabled={images.length >= 10}
        className="px-4 py-2.5 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200 rounded-xl text-[13px] font-semibold disabled:opacity-50 shrink-0 transition-colors outline-none focus:outline-none focus-visible:outline-none"
      >
        Add
      </button>
    </div>
    <ImageUrlList images={images} onRemove={onRemove} />
    <div className="flex items-center justify-between mt-1.5">
      <p className="text-[10px] sm:text-[11px] text-neutral-400">{images.length} / 10 images</p>
      {error && <p className="text-[10px] sm:text-[11px] text-red-500 font-medium">{error}</p>}
    </div>
  </div>
);

const SizesPicker = ({ selected, onToggle, error }) => (
  <div>
    <label className={LABEL_CLS}>Sizes *</label>
    <div className="space-y-3">
      <div>
        <p className="text-[10px] uppercase tracking-wider text-neutral-400 font-bold mb-1.5">Apparel</p>
        <div className="flex flex-wrap gap-1.5">
          {APPAREL_SIZES.map((s) => {
            const on = selected.includes(s);
            return (
              <button
                key={s}
                type="button"
                onClick={() => onToggle(s)}
                className={`px-2.5 py-1.5 text-[12px] font-semibold rounded-lg border transition-colors outline-none focus:outline-none focus-visible:outline-none ${
                  on
                    ? 'border-amber-400 bg-amber-400 text-amber-950'
                    : 'border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:border-amber-300 dark:hover:border-amber-700'
                }`}
                aria-pressed={on}
              >
                {s}
              </button>
            );
          })}
        </div>
      </div>
      <div>
        <p className="text-[10px] uppercase tracking-wider text-neutral-400 font-bold mb-1.5">Footwear</p>
        <div className="flex flex-wrap gap-1.5">
          {SHOE_SIZES.map((s) => {
            const on = selected.includes(s);
            return (
              <button
                key={s}
                type="button"
                onClick={() => onToggle(s)}
                className={`px-2.5 py-1.5 text-[12px] font-semibold rounded-lg border transition-colors outline-none focus:outline-none focus-visible:outline-none ${
                  on
                    ? 'border-amber-400 bg-amber-400 text-amber-950'
                    : 'border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:border-amber-300 dark:hover:border-amber-700'
                }`}
                aria-pressed={on}
              >
                {s}
              </button>
            );
          })}
        </div>
      </div>
    </div>
    {error && <p className="text-[10px] sm:text-[11px] text-red-500 mt-1.5 font-medium">{error}</p>}
  </div>
);

const PriceFields = ({ regularPrice, salePrice, onChange, errors }) => {
  const rp = Number(regularPrice);
  const sp = Number(salePrice);
  const showDiscount = Number.isFinite(rp) && rp > 0 && Number.isFinite(sp) && sp > 0 && sp < rp;
  const discount = showDiscount ? Math.round(((rp - sp) / rp) * 100) : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div>
        <label className={LABEL_CLS}>Regular price (PKR) *</label>
        <input
          type="number"
          min="0"
          inputMode="numeric"
          value={regularPrice}
          onChange={(e) => onChange('regularPrice', e.target.value)}
          placeholder="e.g. 45000"
          className={(errors.regularPrice ? INPUT_ERR_CLS : INPUT_CLS) + ' tabular-nums'}
        />
        {errors.regularPrice && (
          <p className="text-[10px] sm:text-[11px] text-red-500 mt-1.5 font-medium">{errors.regularPrice}</p>
        )}
      </div>

      <div>
        <label className={LABEL_CLS}>
          Sale price (PKR)
          {showDiscount && (
            <span className="ml-2 text-red-500 font-bold normal-case tracking-normal">−{discount}%</span>
          )}
        </label>
        <input
          type="number"
          min="0"
          inputMode="numeric"
          value={salePrice}
          onChange={(e) => onChange('salePrice', e.target.value)}
          placeholder="Leave empty for no sale"
          className={(errors.salePrice ? INPUT_ERR_CLS : INPUT_CLS) + ' tabular-nums'}
        />
        {errors.salePrice && (
          <p className="text-[10px] sm:text-[11px] text-red-500 mt-1.5 font-medium">{errors.salePrice}</p>
        )}
      </div>
    </div>
  );
};

const TogglePill = ({ label, on, onToggle, icon: Icon }) => (
  <button
    type="button"
    onClick={onToggle}
    aria-pressed={on}
    className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-full border text-[12px] sm:text-[13px] font-semibold transition-colors outline-none focus:outline-none focus-visible:outline-none ${
      on
        ? 'border-amber-400 bg-amber-400 text-amber-950'
        : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 hover:border-amber-300 dark:hover:border-amber-700'
    }`}
  >
    {Icon ? <Icon size={14} strokeWidth={2.5} /> : null}
    {label}: {on ? 'On' : 'Off'}
  </button>
);

const DescriptionEditor = ({ editor, stats, onSetLink, onAddImage, error }) => {
  if (!editor || editor.isDestroyed) return null;

  return (
    <div>
      <label className={LABEL_CLS}>Long description *</label>
      <div
        className={`border rounded-2xl overflow-hidden transition-colors focus-within:border-amber-400 dark:focus-within:border-amber-600 ${
          error ? 'border-red-400' : 'border-neutral-200 dark:border-neutral-800'
        }`}
      >
        <EditorToolbar editor={editor} onSetLink={onSetLink} onAddImage={onAddImage} />
        <EditorContent
          editor={editor}
          className="p-3 sm:p-4 min-h-[140px] sm:min-h-[200px] md:min-h-[280px] prose prose-sm sm:prose-base max-w-none focus:outline-none text-[13px] text-neutral-900 dark:text-neutral-100 [&>p]:leading-7 [&>h1]:text-2xl [&>h1]:font-bold [&>h2]:text-xl [&>h2]:font-semibold [&>h3]:text-lg [&>h3]:font-semibold [&>h4]:text-base [&>h4]:font-semibold [&>blockquote]:border-l-4 [&>blockquote]:border-neutral-300 [&>blockquote]:pl-4 [&>blockquote]:italic [&>pre]:bg-neutral-100 dark:[&>pre]:bg-neutral-800 [&>pre]:p-3 [&>pre]:rounded [&>pre]:overflow-x-auto [&>hr]:my-6 [&>hr]:border-t [&>hr]:border-neutral-200 [&>hr]:dark:border-neutral-800 whitespace-pre-wrap"
          style={{ whiteSpace: 'pre-wrap' }}
        />
      </div>
      <div className="flex flex-wrap justify-between gap-x-4 gap-y-1 text-[10px] sm:text-[11px] text-neutral-400 mt-1.5">
        <span className={error ? 'text-red-500 font-medium' : ''}>{error || ' '}</span>
        <span className="flex gap-3 shrink-0 tabular-nums">
          <span className={stats.chars > 50000 ? 'text-red-500 font-medium' : ''}>{stats.chars} chars</span>
          <span>{stats.words} words</span>
          <span>{stats.paragraphs} paragraphs</span>
          <span>{stats.readingTime > 0 ? `${stats.readingTime} min read` : '—'}</span>
        </span>
      </div>
    </div>
  );
};

const DeleteConfirmModal = ({ product, onCancel, onConfirm, deleting }) => (
  <AnimatePresence>
    {product && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
        onClick={onCancel}
        aria-hidden="true"
      >
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.96 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-neutral-900 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden border border-neutral-200/80 dark:border-neutral-800"
          role="dialog"
          aria-modal="true"
        >
          <div className="p-5">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 shrink-0">
                <FiAlertTriangle size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-[15px] font-bold text-neutral-900 dark:text-neutral-100">
                  Delete this product?
                </h3>
                <div className="flex items-center gap-3 mt-2.5">
                  <div className="h-12 w-12 rounded-xl overflow-hidden bg-neutral-100 dark:bg-neutral-800 shrink-0">
                    {product.images?.[0] ? (
                      <img src={product.images[0]} alt={product.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-neutral-400">
                        <FiImage size={16} />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-neutral-800 dark:text-neutral-200 line-clamp-2">
                      {product.title}
                    </p>
                    {product.sku && (
                      <p className="text-[10px] font-mono text-neutral-400 mt-0.5">
                        SKU: {product.sku}
                      </p>
                    )}
                  </div>
                </div>
                <p className="text-[12px] text-red-600 dark:text-red-400 mt-3 font-medium">
                  This action is permanent and cannot be undone.
                </p>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 px-5 py-3 bg-neutral-50 dark:bg-neutral-900/60 border-t border-neutral-200/80 dark:border-neutral-800">
            <button
              onClick={onCancel}
              disabled={deleting}
              className="px-4 py-2 text-[13px] font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl disabled:opacity-50 transition-colors outline-none focus:outline-none focus-visible:outline-none"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={deleting}
              className="px-4 py-2 text-[13px] bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50 font-bold transition-colors shadow-sm outline-none focus:outline-none focus-visible:outline-none"
            >
              {deleting ? 'Deleting…' : 'Delete permanently'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

/* ✅ SKU input with auto-generate + copy-to-clipboard */
const SkuInput = ({ value, onChange, error, brand, category, disabled }) => {
  const [copied, setCopied] = useState(false);

  const handleGenerate = () => {
    if (disabled) return;
    const generated = generateLocalSku(brand, category);
    onChange(generated);
  };

  const handleCopy = async () => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success('SKU copied to clipboard');
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error('Failed to copy SKU');
    }
  };

  return (
    <div>
      <label className={LABEL_CLS}>
        SKU
        <span className="ml-1.5 text-[10px] normal-case tracking-normal font-medium text-neutral-400">
          (leave blank to auto-generate)
        </span>
      </label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <FiTag
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
            size={13}
          />
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ''))}
            placeholder="e.g. NIK-MEN-A3F9K2"
            maxLength={40}
            disabled={disabled}
            className={
              (error ? INPUT_ERR_CLS : INPUT_CLS) +
              ' pl-9 pr-10 font-mono uppercase disabled:opacity-60'
            }
            aria-label="SKU"
          />
          {value && (
            <button
              type="button"
              onClick={handleCopy}
              aria-label="Copy SKU"
              title="Copy SKU"
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors outline-none focus:outline-none focus-visible:outline-none"
            >
              {copied ? <FiCheck size={13} className="text-emerald-500" /> : <FiCopy size={13} />}
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={handleGenerate}
          disabled={disabled}
          className="px-3.5 py-2.5 bg-neutral-100 dark:bg-neutral-800/60 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-xl flex items-center gap-1.5 text-[12px] font-semibold text-neutral-700 dark:text-neutral-300 transition-colors shrink-0 disabled:opacity-50 outline-none focus:outline-none focus-visible:outline-none"
          title="Generate a new SKU"
        >
          <FiRefreshCw size={13} strokeWidth={2.5} />
          <span className="hidden sm:inline">Generate</span>
        </button>
      </div>
      {error && <p className="text-[10px] sm:text-[11px] text-red-500 mt-1.5 font-medium">{error}</p>}
      {!error && value && (
        <p className="text-[10px] text-neutral-400 mt-1.5">
          Server will use this SKU — must be globally unique.
        </p>
      )}
    </div>
  );
};

const ProductFormModal = ({
  editingProduct,
  formData,
  setFormData,
  imageInput,
  setImageInput,
  editor,
  stats,
  submitting,
  formErrors,
  isFullscreen,
  onToggleFullscreen,
  onRequestClose,
  onSubmit,
  onSetLink,
  onAddImage,
}) => {
  const handleImageAdd = () => {
    if (imageInput.trim() && formData.images.length < 10) {
      setFormData((prev) => ({ ...prev, images: [...prev.images, imageInput.trim()] }));
      setImageInput('');
    }
  };

  const handleImageRemove = (index) => {
    setFormData((prev) => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
  };

  const toggleSize = (size) => {
    setFormData((prev) => ({
      ...prev,
      sizes: prev.sizes.includes(size)
        ? prev.sizes.filter((s) => s !== size)
        : [...prev.sizes, size],
    }));
  };

  const handlePriceChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex ${
        isFullscreen
          ? 'items-stretch justify-stretch p-0'
          : 'items-end sm:items-center justify-center sm:p-4'
      }`}
    >
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.98 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
        className={`bg-white dark:bg-neutral-900 overflow-y-auto flex flex-col border border-neutral-200/80 dark:border-neutral-800 ${
          isFullscreen
            ? 'w-full h-full rounded-none border-0'
            : 'w-full sm:max-w-4xl sm:rounded-2xl shadow-2xl h-[95vh] sm:h-auto sm:max-h-[95vh] rounded-t-2xl'
        }`}
      >
        <div className="sticky top-0 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b border-neutral-200/80 dark:border-neutral-800 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between z-10 shrink-0">
          <h2 className="text-base sm:text-xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
            {editingProduct ? 'Edit Product' : 'Create New Product'}
          </h2>
          <div className="flex items-center gap-1">
            <button
              onClick={onToggleFullscreen}
              aria-label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
              title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
              className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full text-neutral-500 transition-colors hidden sm:flex outline-none focus:outline-none focus-visible:outline-none"
            >
              {isFullscreen ? <FiMinimize2 size={17} /> : <FiMaximize2 size={17} />}
            </button>
            <button
              onClick={onRequestClose}
              aria-label="Close"
              className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full text-neutral-500 transition-colors outline-none focus:outline-none focus-visible:outline-none"
            >
              <FiX size={20} />
            </button>
          </div>
        </div>

        <form onSubmit={onSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-5 flex-1">
          <div>
            <label className={LABEL_CLS}>Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
              className={formErrors.title ? INPUT_ERR_CLS : INPUT_CLS}
              placeholder="e.g. Nike Air Max 270 — Triple Black"
            />
            <div className="flex items-center justify-between mt-1.5">
              {formErrors.title ? (
                <p className="text-[10px] sm:text-[11px] text-red-500 font-medium">{formErrors.title}</p>
              ) : (
                <span />
              )}
              <p className="text-[10px] sm:text-[11px] text-neutral-400 shrink-0 tabular-nums">
                {formData.title.length}/200
              </p>
            </div>
          </div>

          {/* ✅ SKU field */}
          <SkuInput
            value={formData.sku}
            onChange={(val) => setFormData((prev) => ({ ...prev, sku: val }))}
            error={formErrors.sku}
            brand={formData.brand}
            category={formData.category}
            disabled={submitting}
          />

          <div>
            <label className={LABEL_CLS}>Short description *</label>
            <textarea
              value={formData.shortDescription}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, shortDescription: e.target.value }))
              }
              rows={2}
              maxLength={300}
              placeholder="A concise one-liner for cards and listings."
              className={(formErrors.shortDescription ? INPUT_ERR_CLS : INPUT_CLS) + ' resize-none'}
            />
            <div className="flex items-center justify-between mt-1.5">
              {formErrors.shortDescription ? (
                <p className="text-[10px] sm:text-[11px] text-red-500 font-medium">
                  {formErrors.shortDescription}
                </p>
              ) : (
                <span />
              )}
              <p className="text-[10px] sm:text-[11px] text-neutral-400 shrink-0 tabular-nums">
                {formData.shortDescription.length}/300
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className={LABEL_CLS}>Category *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
                className={(formErrors.category ? INPUT_ERR_CLS : INPUT_CLS) + ' cursor-pointer'}
              >
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              {formErrors.category && (
                <p className="text-[10px] sm:text-[11px] text-red-500 mt-1.5 font-medium">{formErrors.category}</p>
              )}
            </div>

            <div>
              <label className={LABEL_CLS}>Condition *</label>
              <select
                value={formData.condition}
                onChange={(e) => setFormData((prev) => ({ ...prev, condition: e.target.value }))}
                className={(formErrors.condition ? INPUT_ERR_CLS : INPUT_CLS) + ' cursor-pointer'}
              >
                {CONDITIONS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              {formErrors.condition && (
                <p className="text-[10px] sm:text-[11px] text-red-500 mt-1.5 font-medium">{formErrors.condition}</p>
              )}
            </div>

            <div>
              <label className={LABEL_CLS}>Brand *</label>
              <select
                value={formData.brand}
                onChange={(e) => setFormData((prev) => ({ ...prev, brand: e.target.value }))}
                className={(formErrors.brand ? INPUT_ERR_CLS : INPUT_CLS) + ' cursor-pointer'}
              >
                {BRANDS.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
              {formErrors.brand && (
                <p className="text-[10px] sm:text-[11px] text-red-500 mt-1.5 font-medium">{formErrors.brand}</p>
              )}
            </div>
          </div>

          <SizesPicker
            selected={formData.sizes}
            onToggle={toggleSize}
            error={formErrors.sizes}
          />

          <ImageUrlInput
            imageInput={imageInput}
            setImageInput={setImageInput}
            images={formData.images}
            onAdd={handleImageAdd}
            onRemove={handleImageRemove}
            error={formErrors.images}
          />

          <PriceFields
            regularPrice={formData.regularPrice}
            salePrice={formData.salePrice}
            onChange={handlePriceChange}
            errors={formErrors}
          />

          {editor && !editor.isDestroyed ? (
            <DescriptionEditor
              editor={editor}
              stats={stats}
              onSetLink={onSetLink}
              onAddImage={onAddImage}
              error={formErrors.longDescription}
            />
          ) : (
            <div className="border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 text-neutral-400 text-[13px]">
              Editor is loading…
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 pt-2">
            <TogglePill
              label="Published"
              on={formData.isPublished}
              onToggle={() => setFormData((p) => ({ ...p, isPublished: !p.isPublished }))}
              icon={formData.isPublished ? FiEye : FiEyeOff}
            />
            <TogglePill
              label="Featured"
              on={formData.isFeatured}
              onToggle={() => setFormData((p) => ({ ...p, isFeatured: !p.isFeatured }))}
              icon={FiStar}
            />
            <TogglePill
              label="In Stock"
              on={formData.inStock}
              onToggle={() => setFormData((p) => ({ ...p, inStock: !p.inStock }))}
            />
          </div>

          <div className="max-w-[220px]">
            <label className={LABEL_CLS}>Stock quantity</label>
            <input
              type="number"
              min="0"
              inputMode="numeric"
              value={formData.stockQuantity}
              onChange={(e) =>
                setFormData((p) => ({
                  ...p,
                  stockQuantity: Math.max(0, Number(e.target.value) || 0),
                }))
              }
              className={INPUT_CLS + ' tabular-nums'}
            />
          </div>

          <div className="sticky bottom-0 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-neutral-200/80 dark:border-neutral-800 -mx-4 sm:mx-0 px-4 sm:px-0 pb-1">
            <button
              type="button"
              onClick={onRequestClose}
              className="px-5 py-2.5 text-[13px] font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-colors outline-none focus:outline-none focus-visible:outline-none"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-xl hover:bg-neutral-800 dark:hover:bg-neutral-200 disabled:opacity-50 font-bold text-[13px] transition-colors shadow-sm outline-none focus:outline-none focus-visible:outline-none"
            >
              {submitting
                ? 'Saving…'
                : editingProduct
                ? 'Update Product'
                : 'Create Product'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

/* ════════════════════════════════════════════════════════════
   Main component — AdminProducts
   ════════════════════════════════════════════════════════════ */
const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ totalPages: 1, total: null });
  const [pageSize, setPageSize] = useState(10);

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [brand, setBrand] = useState('All');
  const [condition, setCondition] = useState('All');

  const [viewMode, setViewMode] = useState(() => {
    try {
      return localStorage.getItem('adminProductsViewMode') || 'grid';
    } catch {
      return 'grid';
    }
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [imageInput, setImageInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [productToDelete, setProductToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const initialFormRef = useRef(EMPTY_FORM);
  const abortControllerRef = useRef(null);

  /* ─── Tiptap editor ─────────────────────────────────── */
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: false }),
      Underline,
      Link.configure({ openOnClick: false }),
      Image,
      Placeholder.configure({ placeholder: 'Write the full product description here…' }),
      Blockquote,
      CodeBlock,
      HorizontalRule,
      Strike,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Heading.configure({ levels: [1, 2, 3, 4] }),
    ],
    content: '',
    editorProps: {
      handlePaste: (view, event) => {
        const cd = event.clipboardData;
        if (!cd) return false;
        const html = cd.getData('text/html');
        if (html) return false;
        const text = cd.getData('text/plain');
        if (!text) return false;

        const lines = text.split('\n');
        const { state, dispatch } = view;
        const tr = state.tr;
        const { schema } = state;
        const nodes = lines.map((line) =>
          line.trim() === ''
            ? schema.nodes.paragraph.create()
            : schema.nodes.paragraph.create(null, schema.text(line))
        );
        const fragment = schema.nodes.doc.create(null, nodes);
        const { from, to } = state.selection;
        tr.replaceWith(from, to, fragment.content);
        dispatch(tr);
        return true;
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      setFormData((prev) =>
        prev.longDescription === html ? prev : { ...prev, longDescription: html }
      );
    },
  });

  /* ✅ Silent setter — no onUpdate fire, no race condition */
  const setEditorContent = useCallback(
    (html) => {
      if (!editor || editor.isDestroyed) return;
      editor.commands.setContent(html || '', false);
    },
    [editor]
  );

  /* ─── View mode persistence ─────────────────────────── */
  useEffect(() => {
    try {
      localStorage.setItem('adminProductsViewMode', viewMode);
    } catch {}
  }, [viewMode]);

  /* ─── Debounced search ──────────────────────────────── */
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  /* ─── Fetch products ────────────────────────────────── */
  const fetchProducts = useCallback(async () => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/api/posts', {
        params: {
          page,
          limit: pageSize,
          search: search || undefined,
          category: category !== 'All' ? category : undefined,
          brand: brand !== 'All' ? brand : undefined,
          condition: condition !== 'All' ? condition : undefined,
          published: 'all',
        },
        signal: controller.signal,
      });

      setProducts(res.data.data || []);
      setPagination(res.data.pagination || { totalPages: 1, total: null });
    } catch (err) {
      if (
        axios.isCancel?.(err) ||
        err.code === 'ERR_CANCELED' ||
        err.name === 'CanceledError'
      ) {
        return;
      }
      console.error('Fetch error:', err);
      setError(err.response?.data?.message || 'Failed to fetch products');
      toast.error('Error loading products');
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [page, pageSize, search, category, brand, condition]);

  useEffect(() => {
    fetchProducts();
    return () => {
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, [fetchProducts]);

  /* ─── Filter handlers ───────────────────────────────── */
  const handleCategoryChange = useCallback((val) => {
    setCategory(val);
    setPage(1);
  }, []);
  const handleBrandChange = useCallback((val) => {
    setBrand(val);
    setPage(1);
  }, []);
  const handleConditionChange = useCallback((val) => {
    setCondition(val);
    setPage(1);
  }, []);
  const handlePageSizeChange = useCallback((val) => {
    setPageSize(val);
    setPage(1);
  }, []);

  const hasActiveFilters =
    search !== '' ||
    category !== 'All' ||
    brand !== 'All' ||
    condition !== 'All';

  const clearFilters = useCallback(() => {
    setSearchInput('');
    setSearch('');
    setCategory('All');
    setBrand('All');
    setCondition('All');
    setPage(1);
  }, []);

  const resultsLabel = loading
    ? 'Loading products…'
    : pagination.total != null
    ? `Showing ${products.length} of ${pagination.total} product${
        pagination.total === 1 ? '' : 's'
      }`
    : `Showing ${products.length} product${products.length === 1 ? '' : 's'}`;

  /* ─── Modal open / close ────────────────────────────── */
  const openCreateModal = useCallback(() => {
    setEditingProduct(null);
    setFormData(EMPTY_FORM);
    initialFormRef.current = EMPTY_FORM;
    setImageInput('');
    setFormErrors({});
    setIsFullscreen(false);
    setModalOpen(true);
    setEditorContent('');
  }, [setEditorContent]);

  const openEditModal = useCallback((product) => {
    const initial = {
      title: product.title || '',
      sku: product.sku || '',                    // ✅ NEW
      shortDescription: product.shortDescription || '',
      longDescription: product.longDescription || '',
      category: product.category || 'Men',
      condition: product.condition || 'Excellent',
      brand: product.brand || 'Nike',
      sizes: Array.isArray(product.sizes) ? product.sizes : [],
      images: Array.isArray(product.images) ? product.images : [],
      regularPrice:
        product.regularPrice !== undefined && product.regularPrice !== null
          ? String(product.regularPrice)
          : '',
      salePrice:
        product.salePrice !== undefined && product.salePrice !== null && product.salePrice > 0
          ? String(product.salePrice)
          : '',
      isPublished:
        product.isPublished !== undefined ? product.isPublished : true,
      isFeatured: product.isFeatured === true,
      inStock: product.inStock !== false,
      stockQuantity: product.stockQuantity || 0,
    };
    setEditingProduct(product);
    setFormData(initial);
    initialFormRef.current = initial;
    setImageInput('');
    setFormErrors({});
    setIsFullscreen(false);
    setModalOpen(true);
    setEditorContent(initial.longDescription);
  }, [setEditorContent]);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setEditingProduct(null);
    setFormData(EMPTY_FORM);
    setImageInput('');
    setFormErrors({});
    setIsFullscreen(false);
    setEditorContent('');
  }, [setEditorContent]);

  const hasUnsavedChanges = useCallback(
    () => JSON.stringify(formData) !== JSON.stringify(initialFormRef.current),
    [formData]
  );

  const requestCloseModal = useCallback(() => {
    if (hasUnsavedChanges()) {
      const ok = window.confirm('You have unsaved changes. Are you sure you want to leave?');
      if (!ok) return;
    }
    closeModal();
  }, [hasUnsavedChanges, closeModal]);

  /* ─── Submit ────────────────────────────────────────── */
  const handleSubmit = async (e) => {
    e.preventDefault();

    const finalLongDescription =
      editor && !editor.isDestroyed ? editor.getHTML() : formData.longDescription;

    const dataToValidate = { ...formData, longDescription: finalLongDescription };
    const errors = validateProductForm(dataToValidate);
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      toast.error('Please fix the highlighted fields.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title: formData.title.trim(),
        // ✅ Only send SKU if the admin typed one — otherwise let the backend auto-generate
        ...(formData.sku && formData.sku.trim()
          ? { sku: formData.sku.trim().toUpperCase() }
          : {}),
        shortDescription: formData.shortDescription.trim(),
        longDescription: finalLongDescription,
        category: formData.category,
        condition: formData.condition,
        brand: formData.brand,
        sizes: formData.sizes,
        images: formData.images,
        regularPrice: Number(formData.regularPrice),
        salePrice: formData.salePrice === '' ? 0 : Number(formData.salePrice),
        isPublished: formData.isPublished,
        isFeatured: formData.isFeatured,
        inStock: formData.inStock,
        stockQuantity: Number(formData.stockQuantity) || 0,
      };

      console.log('[AdminProducts] Submitting:', {
        mode: editingProduct ? 'UPDATE' : 'CREATE',
        id: editingProduct?._id,
        payload,
      });

      let res;
      if (editingProduct) {
        res = await api.put(`/api/posts/${editingProduct._id}`, payload);
        toast.success('Product updated successfully');
        setProducts((prev) =>
          prev.map((p) => (p._id === editingProduct._id ? res.data.data : p))
        );
      } else {
        res = await api.post('/api/posts', payload);
        toast.success('Product created successfully');
        setProducts((prev) => [res.data.data, ...prev]);
      }
      closeModal();
      fetchProducts();
    } catch (err) {
      console.error('Submit error:', err);
      console.error('Server response:', err.response?.data);   // ✅ helpful for debugging
      const serverErrors = err.response?.data?.errors;
      if (serverErrors && typeof serverErrors === 'object') {
        setFormErrors((prev) => ({ ...prev, ...serverErrors }));
      }
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Operation failed';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  /* ─── Delete ────────────────────────────────────────── */
  const requestDelete = useCallback((product) => {
    setProductToDelete(product);
  }, []);

  const confirmDelete = async () => {
    if (!productToDelete) return;
    setDeleting(true);
    try {
      await api.delete(`/api/posts/${productToDelete._id}`);
      toast.success('Product deleted');
      setProducts((prev) => prev.filter((p) => p._id !== productToDelete._id));
      setProductToDelete(null);
      fetchProducts();
    } catch (err) {
      console.error('Delete error:', err);
      toast.error(err.response?.data?.message || 'Failed to delete product');
    } finally {
      setDeleting(false);
    }
  };

  /* ─── Editor helpers ────────────────────────────────── */
  const setLink = () => {
    if (!editor || editor.isDestroyed) return;
    const url = window.prompt('Enter the URL:');
    if (url) editor.chain().focus().setLink({ href: url }).run();
  };

  const addImage = () => {
    if (!editor || editor.isDestroyed) return;
    const url = window.prompt('Enter the image URL:');
    if (url) editor.chain().focus().setImage({ src: url }).run();
  };

  const contentStats = useMemo(
    () => getContentStats(formData.longDescription),
    [formData.longDescription]
  );
  const totalPages = pagination.totalPages || 1;

  /* ═════════════════════════════════════════════════════════
     Render
     ═════════════════════════════════════════════════════════ */
  return (
    <div className="space-y-5">
      {/* ─── HEADER HERO ────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-neutral-900 via-neutral-900 to-neutral-800 dark:from-neutral-900 dark:via-neutral-900 dark:to-neutral-800 p-5 sm:p-6"
      >
        <div className="absolute inset-0 opacity-20" aria-hidden="true">
          <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-amber-400 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-64 h-64 rounded-full bg-blue-500 blur-3xl" />
        </div>

        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <FiPackage className="h-4 w-4 text-amber-400" strokeWidth={2.5} aria-hidden="true" />
              <span className="text-[11px] uppercase tracking-wider font-bold text-amber-400">
                Catalog Management
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Manage Products
            </h1>
            <p className="text-[12px] sm:text-[13px] text-neutral-400 mt-1.5 max-w-lg">
              Create, edit, and organize your product catalog in real-time.
            </p>
          </div>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-white text-neutral-900 text-[12px] font-bold hover:bg-neutral-100 transition-colors shadow-sm outline-none focus:outline-none focus-visible:outline-none"
          >
            <FiPlus size={14} strokeWidth={2.5} />
            New Product
          </button>
        </div>
      </motion.div>

      {/* ─── SEARCH / FILTERS ───────────────────── */}
      <SearchFilterBar
        searchInput={searchInput}
        onSearchChange={setSearchInput}
        category={category}
        onCategoryChange={handleCategoryChange}
        brand={brand}
        onBrandChange={handleBrandChange}
        condition={condition}
        onConditionChange={handleConditionChange}
        onRefresh={fetchProducts}
        pageSize={pageSize}
        onPageSizeChange={handlePageSizeChange}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={clearFilters}
        resultsLabel={resultsLabel}
      />

      {/* ─── CONTENT ────────────────────────────── */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-12 w-12 rounded-full border-4 border-neutral-200 dark:border-neutral-800 border-t-amber-400 animate-spin" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center gap-2 py-16 text-center">
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400">
            <FiAlertTriangle size={24} />
          </div>
          <p className="text-[14px] font-semibold text-neutral-900 dark:text-neutral-100">{error}</p>
          <button
            onClick={fetchProducts}
            className="text-[12px] font-semibold text-amber-600 dark:text-amber-400 hover:underline underline-offset-2 outline-none focus:outline-none focus-visible:outline-none"
          >
            Try again
          </button>
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-16 text-center">
          <div className="p-3 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-400">
            <FiPackage size={24} />
          </div>
          <p className="text-[14px] font-semibold text-neutral-900 dark:text-neutral-100">
            {hasActiveFilters ? 'No products match your filters' : 'No products yet'}
          </p>
          <p className="text-[12px] text-neutral-400">
            {hasActiveFilters
              ? 'Try adjusting your search or filters.'
              : 'Create your first product to get started.'}
          </p>
          {hasActiveFilters ? (
            <button
              onClick={clearFilters}
              className="text-[12px] font-semibold text-amber-600 dark:text-amber-400 hover:underline underline-offset-2 mt-1 outline-none focus:outline-none focus-visible:outline-none"
            >
              Clear filters
            </button>
          ) : (
            <button
              onClick={openCreateModal}
              className="mt-1 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-[12px] font-bold hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors outline-none focus:outline-none focus-visible:outline-none"
            >
              <FiPlus size={13} strokeWidth={2.5} />
              Create Product
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <ProductsGrid
          products={products}
          onEdit={openEditModal}
          onDelete={requestDelete}
        />
      ) : (
        <ProductsTable
          products={products}
          onEdit={openEditModal}
          onDelete={requestDelete}
        />
      )}

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />

      <AnimatePresence>
        {modalOpen && (
          <ProductFormModal
            editingProduct={editingProduct}
            formData={formData}
            setFormData={setFormData}
            imageInput={imageInput}
            setImageInput={setImageInput}
            editor={editor}
            stats={contentStats}
            submitting={submitting}
            formErrors={formErrors}
            isFullscreen={isFullscreen}
            onToggleFullscreen={() => setIsFullscreen((v) => !v)}
            onRequestClose={requestCloseModal}
            onSubmit={handleSubmit}
            onSetLink={setLink}
            onAddImage={addImage}
          />
        )}
      </AnimatePresence>

      <DeleteConfirmModal
        product={productToDelete}
        deleting={deleting}
        onCancel={() => setProductToDelete(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
};

export default AdminProducts;