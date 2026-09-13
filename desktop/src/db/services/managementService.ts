import { db } from '../db';
import type {
  Employee,
  Department,
  BankAccount,
  BalanceSheetItem,
  UploadedFile,
  UploadCategory,
  Currency,
} from '../../types';
import { logActivity } from './activityService';
import { realtimeSync } from '../../services/realtimeSyncService';

// ==========================================
// 1. EMPLOYEES SERVICES
// ==========================================

export async function getAllEmployees(): Promise<Employee[]> {
  const list = await db.employees.toArray();
  return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getEmployeeById(id: string): Promise<Employee | undefined> {
  return await db.employees.get(id);
}

export async function createEmployee(data: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>): Promise<Employee> {
  const now = new Date().toISOString();
  const emp: Employee = {
    id: `emp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    ...data,
    createdAt: now,
    updatedAt: now,
  };

  await db.employees.put(emp);
  await logActivity('created_employee', 'employee', `Hired ${emp.name} as ${emp.role}`, emp.id);
  realtimeSync.broadcast('employees', 'create', emp);
  return emp;
}

export async function updateEmployee(id: string, updates: Partial<Employee>): Promise<Employee> {
  const existing = await db.employees.get(id);
  if (!existing) throw new Error(`Employee with ID ${id} not found`);

  const updated: Employee = {
    ...existing,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  await db.employees.put(updated);
  await logActivity('updated_employee', 'employee', `Updated details for ${updated.name}`, id);
  realtimeSync.broadcast('employees', 'update', updated);
  return updated;
}

export async function deleteEmployee(id: string): Promise<void> {
  const existing = await db.employees.get(id);
  if (existing) {
    await db.employees.delete(id);

    // Unlink if this employee was the designated department head
    const depts = await db.departments.where('headEmployeeId').equals(id).toArray();
    for (const d of depts) {
      await db.departments.update(d.id, { headEmployeeId: undefined, headEmployeeName: undefined });
    }

    await logActivity('deleted_employee', 'employee', `Removed employee record for ${existing.name}`, id);
    realtimeSync.broadcast('employees', 'delete', existing);
  }
}

export async function getPayrollSummary() {
  const employees = await db.employees.toArray();
  const active = employees.filter((e) => e.status === 'active');

  let totalAnnualPayroll = 0;
  let totalMonthlyPayroll = 0;

  for (const emp of active) {
    let annualSalary = 0;
    if (emp.salaryPeriod === 'annual') {
      annualSalary = emp.salary || 0;
    } else if (emp.salaryPeriod === 'monthly') {
      annualSalary = (emp.salary || 0) * 12;
    } else if (emp.salaryPeriod === 'hourly') {
      annualSalary = (emp.salary || 0) * 2080; // Standard full-time equivalent hours
    }

    totalAnnualPayroll += annualSalary;
    totalMonthlyPayroll += annualSalary / 12;
  }

  return {
    totalEmployees: employees.length,
    activeHeadcount: active.length,
    contractorsCount: active.filter((e) => e.employmentType === 'contractor').length,
    fullTimeCount: active.filter((e) => e.employmentType === 'full_time').length,
    totalMonthlyPayroll: Math.round(totalMonthlyPayroll),
    totalAnnualPayroll: Math.round(totalAnnualPayroll),
  };
}

// ==========================================
// 2. DEPARTMENTS SERVICES
// ==========================================

export async function getAllDepartments(): Promise<Department[]> {
  const list = await db.departments.toArray();
  return list.sort((a, b) => a.name.localeCompare(b.name));
}

export async function createDepartment(data: Omit<Department, 'id' | 'createdAt' | 'updatedAt'>): Promise<Department> {
  const now = new Date().toISOString();
  const dept: Department = {
    id: `dept_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    ...data,
    createdAt: now,
    updatedAt: now,
  };

  await db.departments.put(dept);
  await logActivity('created_department', 'department', `Created department ${dept.name}`, dept.id);
  realtimeSync.broadcast('departments', 'create', dept);
  return dept;
}

export async function updateDepartment(id: string, updates: Partial<Department>): Promise<Department> {
  const existing = await db.departments.get(id);
  if (!existing) throw new Error(`Department with ID ${id} not found`);

  const updated: Department = {
    ...existing,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  await db.departments.put(updated);
  await logActivity('updated_department', 'department', `Updated department ${updated.name}`, id);
  realtimeSync.broadcast('departments', 'update', updated);
  return updated;
}

export async function deleteDepartment(id: string): Promise<void> {
  const existing = await db.departments.get(id);
  if (existing) {
    await db.departments.delete(id);

    // Unlink employees belonging to this department
    const employees = await db.employees.where('departmentId').equals(id).toArray();
    for (const emp of employees) {
      await db.employees.update(emp.id, { departmentId: undefined, departmentName: undefined });
    }

    await logActivity('deleted_department', 'department', `Deleted department ${existing.name}`, id);
    realtimeSync.broadcast('departments', 'delete', existing);
  }
}

// ==========================================
// 3. CASH & BANK ACCOUNTS SERVICES
// ==========================================

export async function getAllBankAccounts(): Promise<BankAccount[]> {
  const list = await db.bankAccounts.toArray();
  return list.sort((a, b) => (b.isPrimary ? 1 : 0) - (a.isPrimary ? 1 : 0));
}

export async function createBankAccount(data: Omit<BankAccount, 'id' | 'createdAt' | 'updatedAt'>): Promise<BankAccount> {
  const now = new Date().toISOString();
  const acc: BankAccount = {
    id: `acc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    ...data,
    createdAt: now,
    updatedAt: now,
  };

  if (acc.isPrimary) {
    // Demote other primary accounts
    const all = await db.bankAccounts.toArray();
    for (const other of all) {
      if (other.isPrimary) {
        await db.bankAccounts.update(other.id, { isPrimary: false });
      }
    }
  }

  await db.bankAccounts.put(acc);
  await logActivity('created_bank_account', 'bank_account', `Added ${acc.institution} (${acc.accountName})`, acc.id);
  realtimeSync.broadcast('bankAccounts', 'create', acc);
  return acc;
}

export async function updateBankAccount(id: string, updates: Partial<BankAccount>): Promise<BankAccount> {
  const existing = await db.bankAccounts.get(id);
  if (!existing) throw new Error(`Bank Account with ID ${id} not found`);

  if (updates.isPrimary) {
    const all = await db.bankAccounts.toArray();
    for (const other of all) {
      if (other.id !== id && other.isPrimary) {
        await db.bankAccounts.update(other.id, { isPrimary: false });
      }
    }
  }

  const updated: BankAccount = {
    ...existing,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  await db.bankAccounts.put(updated);
  await logActivity('updated_bank_account', 'bank_account', `Updated balance for ${updated.accountName} ($${updated.balance.toLocaleString()})`, id);
  realtimeSync.broadcast('bankAccounts', 'update', updated);
  return updated;
}

export async function deleteBankAccount(id: string): Promise<void> {
  const existing = await db.bankAccounts.get(id);
  if (existing) {
    await db.bankAccounts.delete(id);

    // If deleted account was primary, promote first remaining account to primary
    if (existing.isPrimary) {
      const remaining = await db.bankAccounts.toArray();
      if (remaining.length > 0) {
        await db.bankAccounts.update(remaining[0].id, { isPrimary: true });
      }
    }

    await logActivity('deleted_bank_account', 'bank_account', `Removed ${existing.accountName}`, id);
    realtimeSync.broadcast('bankAccounts', 'delete', existing);
  }
}

export async function getCashPositionSummary() {
  const accounts = await db.bankAccounts.toArray();
  let totalCash = 0;
  let checkingCash = 0;
  let treasuryCash = 0;
  let estimatedAnnualYield = 0;

  for (const a of accounts) {
    totalCash += a.balance || 0;
    if (a.accountType === 'checking' || a.accountType === 'stripe') {
      checkingCash += a.balance || 0;
    } else if (a.accountType === 'treasury' || a.accountType === 'savings') {
      treasuryCash += a.balance || 0;
      if (a.apy) {
        estimatedAnnualYield += (a.balance * a.apy) / 100;
      }
    }
  }

  return {
    accountsCount: accounts.length,
    totalCash,
    checkingCash,
    treasuryCash,
    estimatedAnnualYield: Math.round(estimatedAnnualYield),
  };
}

// ==========================================
// 4. BALANCE SHEET (ASSETS & LIABILITIES)
// ==========================================

export async function getAllBalanceSheetItems(): Promise<BalanceSheetItem[]> {
  const list = await db.balanceSheetItems.toArray();
  return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function createBalanceSheetItem(data: Omit<BalanceSheetItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<BalanceSheetItem> {
  const now = new Date().toISOString();
  const item: BalanceSheetItem = {
    id: `bs_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    ...data,
    createdAt: now,
    updatedAt: now,
  };

  await db.balanceSheetItems.put(item);
  await logActivity(
    'created_balance_sheet_item',
    'balance_sheet',
    `Added ${item.type === 'asset' ? 'Asset' : 'Liability'}: ${item.name} ($${item.value.toLocaleString()})`,
    item.id
  );
  realtimeSync.broadcast('balanceSheetItems', 'create', item);
  return item;
}

export async function updateBalanceSheetItem(id: string, updates: Partial<BalanceSheetItem>): Promise<BalanceSheetItem> {
  const existing = await db.balanceSheetItems.get(id);
  if (!existing) throw new Error(`Balance sheet item with ID ${id} not found`);

  const updated: BalanceSheetItem = {
    ...existing,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  await db.balanceSheetItems.put(updated);
  await logActivity('updated_balance_sheet_item', 'balance_sheet', `Updated ${updated.name}`, id);
  realtimeSync.broadcast('balanceSheetItems', 'update', updated);
  return updated;
}

export async function deleteBalanceSheetItem(id: string): Promise<void> {
  const existing = await db.balanceSheetItems.get(id);
  if (existing) {
    await db.balanceSheetItems.delete(id);
    await logActivity('deleted_balance_sheet_item', 'balance_sheet', `Deleted ${existing.name}`, id);
    realtimeSync.broadcast('balanceSheetItems', 'delete', existing);
  }
}

export async function getBalanceSheetSummary() {
  const [items, bankAccounts] = await Promise.all([
    db.balanceSheetItems.toArray(),
    db.bankAccounts.toArray(),
  ]);

  let totalCash = bankAccounts.reduce((sum, b) => sum + (b.balance || 0), 0);
  let otherCurrentAssets = 0;
  let fixedAssets = 0;
  let intangibleAssets = 0;

  let currentLiabilities = 0;
  let longTermLiabilities = 0;

  for (const item of items) {
    if (item.type === 'asset') {
      if (item.category === 'current_asset') otherCurrentAssets += item.value || 0;
      else if (item.category === 'fixed_asset') fixedAssets += item.value || 0;
      else if (item.category === 'intangible_asset') intangibleAssets += item.value || 0;
    } else {
      if (item.category === 'current_liability') currentLiabilities += item.value || 0;
      else if (item.category === 'long_term_liability') longTermLiabilities += item.value || 0;
    }
  }

  const totalCurrentAssets = totalCash + otherCurrentAssets;
  const totalAssets = totalCurrentAssets + fixedAssets + intangibleAssets;
  const totalLiabilities = currentLiabilities + longTermLiabilities;
  const netWorth = totalAssets - totalLiabilities;

  return {
    totalCash,
    otherCurrentAssets,
    totalCurrentAssets,
    fixedAssets,
    intangibleAssets,
    totalAssets,
    currentLiabilities,
    longTermLiabilities,
    totalLiabilities,
    netWorth,
  };
}

// ==========================================
// 5. UPLOADS & FILE VAULT SERVICES
// ==========================================

export async function getAllUploadedFiles(): Promise<UploadedFile[]> {
  const list = await db.uploadedFiles.toArray();
  return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getUploadedFileById(id: string): Promise<UploadedFile | undefined> {
  return await db.uploadedFiles.get(id);
}

export async function saveUploadedFileRecord(data: Omit<UploadedFile, 'id' | 'createdAt' | 'updatedAt'>): Promise<UploadedFile> {
  const now = new Date().toISOString();
  const record: UploadedFile = {
    id: `file_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    ...data,
    createdAt: now,
    updatedAt: now,
  };
  await db.uploadedFiles.put(record);
  await logActivity('uploaded_file', 'file', `Uploaded ${record.name} (${record.category})`, record.id);
  realtimeSync.broadcast('uploadedFiles', 'create', record);
  return record;
}

export async function createUploadedFile(
  file: File,
  category: UploadCategory = 'other',
  description?: string,
  relatedEntityType?: any,
  relatedEntityId?: string
): Promise<UploadedFile> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64Data = reader.result as string;
        const now = new Date().toISOString();
        const extension = file.name.split('.').pop()?.toLowerCase() || 'bin';

        const record: UploadedFile = {
          id: `file_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          name: file.name,
          fileType: extension,
          category,
          sizeBytes: file.size,
          mimeType: file.type || 'application/octet-stream',
          dataBase64: base64Data,
          description,
          relatedEntityType,
          relatedEntityId,
          createdAt: now,
          updatedAt: now,
        };

        await db.uploadedFiles.put(record);
        await logActivity('uploaded_file', 'file', `Uploaded ${record.name} (${category})`, record.id);
        realtimeSync.broadcast('uploadedFiles', 'create', record);
        resolve(record);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file for storage'));
    reader.readAsDataURL(file);
  });
}

export async function deleteUploadedFile(id: string): Promise<void> {
  const existing = await db.uploadedFiles.get(id);
  if (existing) {
    await db.uploadedFiles.delete(id);
    await logActivity('deleted_file', 'file', `Deleted file ${existing.name}`, id);
    realtimeSync.broadcast('uploadedFiles', 'delete', existing);
  }
}
