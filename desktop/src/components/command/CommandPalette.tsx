import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Users,
  DollarSign,
  TrendingUp,
  CheckSquare,
  FolderKanban,
  FileText,
  Target,
  Sparkles,
  Settings,
  Plus,
  ArrowRight,
  Bug,
  UserCheck,
  Building2,
  Landmark,
  Scale,
  UploadCloud,
  MonitorDown,
  Zap,
  Bot,
  Cpu,
} from 'lucide-react';
import { db } from '../../db';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (route: string) => void;
  onOpenAi: () => void;
  onCreateTask: () => void;
  onCreateCustomer: () => void;
  onCreateExpense: () => void;
  onGenerateBriefing: () => void;
}

interface SearchResultItem {
  id: string;
  title: string;
  subtitle: string;
  category: 'Navigation' | 'Actions' | 'Customers' | 'Tasks' | 'Deals' | 'Projects' | 'Notes' | 'Employees' | 'Vault';
  icon: React.ReactNode;
  action: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onOpenAi,
  onCreateTask,
  onCreateCustomer,
  onCreateExpense,
  onGenerateBriefing,
}) => {
  const [query, setQuery] = useState('');
  const [dbResults, setDbResults] = useState<SearchResultItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Search across IndexedDB when query changes
  useEffect(() => {
    let isCancelled = false;

    async function searchDatabase() {
      if (!query.trim()) {
        setDbResults([]);
        return;
      }

      const q = query.toLowerCase();
      const results: SearchResultItem[] = [];

      try {
        const [customers, tasks, deals, projects, notes, employees, files] = await Promise.all([
          db.customers.toArray(),
          db.tasks.toArray(),
          db.deals.toArray(),
          db.projects.toArray(),
          db.notes.toArray(),
          db.employees.toArray(),
          db.uploadedFiles.toArray(),
        ]);

        if (isCancelled) return;

        // Search Customers
        for (const c of customers) {
          if (c.companyName.toLowerCase().includes(q) || c.contactName.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)) {
            results.push({
              id: c.id,
              title: c.companyName,
              subtitle: `Customer • ${c.status} • MRR $${c.monthlyRevenue.toLocaleString()}`,
              category: 'Customers',
              icon: <Users size={15} />,
              action: () => {
                onNavigate('/customers');
                onClose();
              },
            });
          }
        }

        // Search Employees
        for (const emp of employees) {
          if (emp.name.toLowerCase().includes(q) || emp.role.toLowerCase().includes(q) || emp.departmentName?.toLowerCase().includes(q)) {
            results.push({
              id: emp.id,
              title: emp.name,
              subtitle: `Employee • ${emp.role} (${emp.departmentName || 'Team'}) • ${emp.status}`,
              category: 'Employees',
              icon: <UserCheck size={15} />,
              action: () => {
                onNavigate('/management/employees');
                onClose();
              },
            });
          }
        }

        // Search Vault Files
        for (const f of files) {
          if (f.name.toLowerCase().includes(q) || f.category.toLowerCase().includes(q) || (f.description && f.description.toLowerCase().includes(q))) {
            results.push({
              id: f.id,
              title: f.name,
              subtitle: `Vault Document • ${f.category} • ${f.fileType}`,
              category: 'Vault',
              icon: <UploadCloud size={15} />,
              action: () => {
                onNavigate('/management/uploads');
                onClose();
              },
            });
          }
        }

        // Search Tasks
        for (const t of tasks) {
          if (t.title.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q)) {
            results.push({
              id: t.id,
              title: t.title,
              subtitle: `Task • ${t.status} • Priority ${t.priority}`,
              category: 'Tasks',
              icon: <CheckSquare size={15} />,
              action: () => {
                onNavigate('/tasks');
                onClose();
              },
            });
          }
        }

        // Search Deals
        for (const d of deals) {
          if (d.name.toLowerCase().includes(q) || d.customerName?.toLowerCase().includes(q)) {
            results.push({
              id: d.id,
              title: d.name,
              subtitle: `Deal • ${d.stage} • $${d.value.toLocaleString()}`,
              category: 'Deals',
              icon: <TrendingUp size={15} />,
              action: () => {
                onNavigate('/sales');
                onClose();
              },
            });
          }
        }

        // Search Projects
        for (const p of projects) {
          if (p.name.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q)) {
            results.push({
              id: p.id,
              title: p.name,
              subtitle: `Project • ${p.status} • ${p.progress}% done`,
              category: 'Projects',
              icon: <FolderKanban size={15} />,
              action: () => {
                onNavigate('/projects');
                onClose();
              },
            });
          }
        }

        // Search Notes
        for (const n of notes) {
          if (n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)) {
            results.push({
              id: n.id,
              title: n.title,
              subtitle: `Note • ${n.category}`,
              category: 'Notes',
              icon: <FileText size={15} />,
              action: () => {
                onNavigate('/notes');
                onClose();
              },
            });
          }
        }

        setDbResults(results.slice(0, 10));
      } catch (err) {
        console.error('Command palette search error:', err);
      }
    }

    searchDatabase();
    return () => {
      isCancelled = true;
    };
  }, [query, onNavigate, onClose]);

  // Static Navigation & Action items
  const staticItems: SearchResultItem[] = [
    {
      id: 'act_briefing',
      title: 'Generate Daily Founder Briefing',
      subtitle: 'Ask AI Copilot to analyze all operational metrics for today',
      category: 'Actions',
      icon: <Sparkles size={15} color="var(--brand-accent)" />,
      action: () => {
        onClose();
        onGenerateBriefing();
      },
    },
    {
      id: 'act_download_desktop',
      title: 'Download FounderOS Desktop App (.exe)',
      subtitle: 'Native Windows setup installer with background AI & offline SQLite',
      category: 'Actions',
      icon: <MonitorDown size={15} color="var(--brand-accent)" />,
      action: () => {
        onClose();
        const link = document.createElement('a');
        link.href = '/downloads/FounderOS-Setup.exe';
        link.download = 'FounderOS-Setup.exe';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      },
    },
    {
      id: 'act_reconcile',
      title: 'Run AI Financial Reconciliation',
      subtitle: 'Audit bank ledger against client invoices and contracts',
      category: 'Actions',
      icon: <Sparkles size={15} color="var(--brand-accent)" />,
      action: () => {
        onNavigate('/finance');
        onClose();
      },
    },
    {
      id: 'act_task',
      title: 'Create New Task',
      subtitle: 'Add a new priority task to execution backlog',
      category: 'Actions',
      icon: <Plus size={15} />,
      action: () => {
        onClose();
        onCreateTask();
      },
    },
    {
      id: 'act_customer',
      title: 'Add New Customer',
      subtitle: 'Record a new enterprise lead or active account',
      category: 'Actions',
      icon: <Plus size={15} />,
      action: () => {
        onClose();
        onCreateCustomer();
      },
    },
    {
      id: 'act_expense',
      title: 'Record Transaction / Expense',
      subtitle: 'Log financial income or operational expense',
      category: 'Actions',
      icon: <Plus size={15} />,
      action: () => {
        onClose();
        onCreateExpense();
      },
    },
    {
      id: 'nav_overview',
      title: 'Go to Command Center (Overview)',
      subtitle: 'Executive dashboard & company health metrics',
      category: 'Navigation',
      icon: <Target size={15} />,
      action: () => {
        onNavigate('/');
        onClose();
      },
    },
    {
      id: 'nav_morning_intelligence',
      title: 'Go to Morning Intelligence',
      subtitle: 'Daily executive situation briefing, priorities, risks, and OKRs',
      category: 'Navigation',
      icon: <Target size={15} color="#f59e0b" />,
      action: () => {
        onNavigate('/morning-intelligence');
        onClose();
      },
    },
    {
      id: 'nav_kpis',
      title: 'Go to KPI Center',
      subtitle: 'SaaS unit economics, LTV:CAC, Rule of 40 & runway modeler',
      category: 'Navigation',
      icon: <TrendingUp size={15} />,
      action: () => {
        onNavigate('/kpis');
        onClose();
      },
    },
    {
      id: 'nav_ai_ceo',
      title: 'Go to AI CEO Workspace',
      subtitle: 'Autonomous executive partner for natural language intelligence and verified actions',
      category: 'Navigation',
      icon: <Sparkles size={15} color="var(--brand-accent)" />,
      action: () => {
        onNavigate('/ai');
        onClose();
      },
    },
    {
      id: 'nav_management',
      title: 'Management & Assets (Coming Soon)',
      subtitle: 'Corporate treasury, balance sheet, employees, departments & corporate vault',
      category: 'Navigation',
      icon: <Building2 size={15} color="#34d399" />,
      action: () => {
        onNavigate('/management');
        onClose();
      },
    },
    {
      id: 'nav_finance',
      title: 'Go to Finance',
      subtitle: 'Cash runway, transactions, and invoices',
      category: 'Navigation',
      icon: <DollarSign size={15} />,
      action: () => {
        onNavigate('/finance');
        onClose();
      },
    },
    {
      id: 'nav_customers',
      title: 'Go to Customers',
      subtitle: 'CRM accounts, MRR, and client relationships',
      category: 'Navigation',
      icon: <Users size={15} />,
      action: () => {
        onNavigate('/customers');
        onClose();
      },
    },
    {
      id: 'nav_sales',
      title: 'Go to Sales Pipeline',
      subtitle: 'Deals Kanban board and expected close dates',
      category: 'Navigation',
      icon: <TrendingUp size={15} />,
      action: () => {
        onNavigate('/sales');
        onClose();
      },
    },
    {
      id: 'nav_product_tech',
      title: 'Product & Technology (Coming Soon)',
      subtitle: 'Product backlog, feature prioritization, and engineering bug tracker',
      category: 'Navigation',
      icon: <FolderKanban size={15} color="#fbbf24" />,
      action: () => {
        onNavigate('/product');
        onClose();
      },
    },
    {
      id: 'nav_ai',
      title: 'Go to AI Copilot Workspace',
      subtitle: 'Autonomous natural language company assistant',
      category: 'Navigation',
      icon: <Sparkles size={15} />,
      action: () => {
        onNavigate('/ai');
        onClose();
      },
    },
    {
      id: 'nav_settings',
      title: 'Go to Settings & AI Providers',
      subtitle: 'Configure OpenRouter, OpenAI, and Data Backup',
      category: 'Navigation',
      icon: <Settings size={15} />,
      action: () => {
        onNavigate('/settings');
        onClose();
      },
    },
    {
      id: 'nav_v2',
      title: 'FounderOS V2 (Coming Soon)',
      subtitle: 'Next-generation multi-agent autonomous architecture (In Development)',
      category: 'Navigation',
      icon: <Sparkles size={15} color="#c084fc" />,
      action: () => {
        onNavigate('/v2');
        onClose();
      },
    },
  ];

  // Combine and filter items
  const filteredStatic = query.trim()
    ? staticItems.filter(
        (item) =>
          item.title.toLowerCase().includes(query.toLowerCase()) ||
          item.subtitle.toLowerCase().includes(query.toLowerCase())
      )
    : staticItems;

  const allItems = [...dbResults, ...filteredStatic];

  // Handle keyboard navigation (ArrowUp, ArrowDown, Enter, Escape)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1 < allItems.length ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 >= 0 ? prev - 1 : allItems.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (allItems[selectedIndex]) {
        allItems[selectedIndex].action();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(3, 7, 18, 0.75)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        zIndex: 3000,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '12vh',
        paddingLeft: '16px',
        paddingRight: '16px',
      }}
      onClick={onClose}
    >
      <div
        className="glass-card animate-fade-in"
        style={{
          width: '100%',
          maxWidth: '620px',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: '0 30px 80px -15px rgba(0, 0, 0, 0.8)',
          overflow: 'hidden',
          maxHeight: '75vh',
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-faint)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <Search size={18} color="var(--brand-accent)" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type a command or search customers, tasks, deals, notes..."
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              color: 'var(--text-main)',
              fontSize: '15px',
              outline: 'none',
            }}
          />
          <kbd
            style={{
              padding: '2px 6px',
              borderRadius: '4px',
              backgroundColor: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-faint)',
              fontSize: '11px',
              color: 'var(--text-dim)',
            }}
          >
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div
          style={{
            overflowY: 'auto',
            padding: '8px',
            maxHeight: '400px',
          }}
        >
          {allItems.length === 0 ? (
            <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
              No matching records or actions found for "{query}"
            </div>
          ) : (
            allItems.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id + idx}
                  onClick={() => item.action()}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: isSelected ? 'var(--primary-blue-surface)' : 'transparent',
                    border: isSelected ? '1px solid var(--border-active)' : '1px solid transparent',
                    cursor: 'pointer',
                    transition: 'all 0.1s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                    <div
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '6px',
                        backgroundColor: isSelected ? 'var(--brand-accent)' : 'var(--bg-surface-elevated)',
                        color: isSelected ? '#ffffff' : 'var(--text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {item.icon}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: '13.5px',
                          fontWeight: 600,
                          color: isSelected ? 'var(--text-main)' : 'var(--text-main)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {item.title}
                      </div>
                      <div
                        style={{
                          fontSize: '11.5px',
                          color: isSelected ? 'var(--brand-accent)' : 'var(--text-dim)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {item.subtitle}
                      </div>
                    </div>
                  </div>

                  <ArrowRight
                    size={14}
                    style={{
                      color: isSelected ? 'var(--brand-accent)' : 'transparent',
                      flexShrink: 0,
                    }}
                  />
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div
          style={{
            padding: '10px 16px',
            borderTop: '1px solid var(--border-faint)',
            backgroundColor: 'var(--bg-surface-elevated)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '11px',
            color: 'var(--text-dim)',
          }}
        >
          <div style={{ display: 'flex', gap: '12px' }}>
            <span>↑↓ to navigate</span>
            <span>↵ to select</span>
          </div>
          <span>FounderOS Command Matrix</span>
        </div>
      </div>
    </div>
  );
};
