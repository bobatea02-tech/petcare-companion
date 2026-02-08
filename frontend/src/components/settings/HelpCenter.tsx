'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
}

const faqs: FAQ[] = [
  {
    id: '1',
    category: 'Getting Started',
    question: 'How do I add my first pet?',
    answer:
      'Click on the "Add Pet" button in your dashboard. Fill in your pet\'s basic information including name, species, breed, age, and any medical conditions. You can also upload a photo to personalize their profile!',
  },
  {
    id: '2',
    category: 'Getting Started',
    question: 'How does the AI symptom checker work?',
    answer:
      'Our AI analyzes your pet\'s symptoms using advanced veterinary knowledge. Simply describe what you\'re observing, and the AI will provide a triage level (Green, Yellow, or Red) with recommendations. Remember, this is not a replacement for professional veterinary care.',
  },
  {
    id: '3',
    category: 'Medications',
    question: 'How do I set up medication reminders?',
    answer:
      'Go to your pet\'s profile, click "Add Medication," and enter the medication details including dosage and frequency. You can set custom reminder times in the notification settings.',
  },
  {
    id: '4',
    category: 'Medications',
    question: 'What happens when medication runs low?',
    answer:
      'PawPal automatically tracks your medication supply. When it reaches the refill threshold, you\'ll receive notifications via your preferred channels (push, email, or SMS) to remind you to order more.',
  },
  {
    id: '5',
    category: 'Health Records',
    question: 'Can I upload my pet\'s medical documents?',
    answer:
      'Yes! You can upload vaccination records, lab results, and other medical documents. Our AI can extract key information from these documents to keep your pet\'s health records up to date.',
  },
  {
    id: '6',
    category: 'Health Records',
    question: 'How do I export my pet\'s health summary?',
    answer:
      'Go to your pet\'s health records and click "Export Summary." This generates a comprehensive report perfect for vet visits, including medical history, medications, and recent symptoms.',
  },
  {
    id: '7',
    category: 'Appointments',
    question: 'How do appointment reminders work?',
    answer:
      'You\'ll receive reminders 24 hours and 2 hours before each appointment. You can customize these times in your notification settings.',
  },
  {
    id: '8',
    category: 'Emergency',
    question: 'What should I do in a pet emergency?',
    answer:
      'Use the AI symptom checker immediately. If it shows a Red triage level, you\'ll see nearby 24/7 emergency vet clinics with directions. Always call ahead when possible, and transport your pet safely.',
  },
  {
    id: '9',
    category: 'Privacy',
    question: 'Is my pet\'s data secure?',
    answer:
      'Absolutely! We use industry-standard encryption for all data. Your information is never shared without your explicit consent. You can export or delete your data at any time from the Privacy settings.',
  },
  {
    id: '10',
    category: 'Account',
    question: 'How do I change my notification preferences?',
    answer:
      'Go to Settings > Notifications. You can customize which notifications you receive and through which channels (push, email, SMS) for each category.',
  },
];

const categories = Array.from(new Set(faqs.map((faq) => faq.category)));

export function HelpCenter() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);

  const filteredFaqs = faqs.filter((faq) => {
    const matchesSearch =
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Help Center</h2>
        <p className="text-gray-600">Find answers to common questions about PawPal</p>
      </div>

      {/* Search */}
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search for help..."
          className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
        />
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl">🔍</span>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedCategory(null)}
          className={cn(
            'px-4 py-2 rounded-full text-sm font-medium transition-all',
            !selectedCategory
              ? 'bg-orange-500 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          )}
        >
          All Topics
        </button>
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={cn(
              'px-4 py-2 rounded-full text-sm font-medium transition-all',
              selectedCategory === category
                ? 'bg-orange-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            )}
          >
            {category}
          </button>
        ))}
      </div>

      {/* FAQs */}
      <div className="space-y-3">
        {filteredFaqs.length === 0 ? (
          <div className="text-center py-12">
            <span className="text-6xl mb-4 block">🐾</span>
            <p className="text-gray-600">No results found. Try a different search term.</p>
          </div>
        ) : (
          filteredFaqs.map((faq) => (
            <div
              key={faq.id}
              className="border border-gray-200 rounded-lg overflow-hidden hover:border-orange-300 transition-colors"
            >
              <button
                onClick={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
                className="w-full px-5 py-4 text-left flex items-center justify-between hover:bg-orange-50 transition-colors"
              >
                <div className="flex-1">
                  <div className="text-xs text-orange-600 font-medium mb-1">{faq.category}</div>
                  <div className="font-semibold text-gray-900">{faq.question}</div>
                </div>
                <span
                  className={cn(
                    'text-2xl transition-transform',
                    expandedFaq === faq.id && 'rotate-180'
                  )}
                >
                  ⌄
                </span>
              </button>
              {expandedFaq === faq.id && (
                <div className="px-5 py-4 bg-gray-50 border-t border-gray-200">
                  <p className="text-gray-700">{faq.answer}</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Contact Support */}
      <div className="p-6 bg-gradient-to-br from-orange-50 to-pink-50 rounded-lg border border-orange-200">
        <div className="flex items-start gap-4">
          <span className="text-4xl">💬</span>
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Still need help?</h3>
            <p className="text-gray-700 mb-4">
              Our support team is here to help! Reach out and we'll get back to you as soon as
              possible.
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href="mailto:support@pawpal.com"
                className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
              >
                <span>📧</span>
                <span>Email Support</span>
              </a>
              <a
                href="#"
                className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <span>💬</span>
                <span>Live Chat</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <a
          href="#"
          className="p-4 border border-gray-200 rounded-lg hover:border-orange-300 hover:bg-orange-50 transition-all"
        >
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">📚</span>
            <span className="font-semibold text-gray-900">User Guide</span>
          </div>
          <p className="text-sm text-gray-600">Complete guide to using PawPal</p>
        </a>
        <a
          href="#"
          className="p-4 border border-gray-200 rounded-lg hover:border-orange-300 hover:bg-orange-50 transition-all"
        >
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">🎥</span>
            <span className="font-semibold text-gray-900">Video Tutorials</span>
          </div>
          <p className="text-sm text-gray-600">Watch step-by-step tutorials</p>
        </a>
      </div>
    </div>
  );
}
