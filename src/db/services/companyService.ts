import { db } from '../db';
import type { Company, AppSettings } from '../../types';
import { logActivity } from './activityService';

export async function getCompany(): Promise<Company | null> {
  const all = await db.companies.toArray();
  return all[0] || null;
}

export async function saveCompany(companyData: Partial<Company>): Promise<Company> {
  const existing = await getCompany();
  const now = new Date().toISOString();

  const company: Company = {
    id: existing?.id || 'comp_main',
    name: companyData.name || existing?.name || 'My Company',
    legalName: companyData.legalName || existing?.legalName,
    description: companyData.description || existing?.description,
    website: companyData.website || existing?.website,
    industry: companyData.industry || existing?.industry,
    foundedDate: companyData.foundedDate || existing?.foundedDate,
    currency: companyData.currency || existing?.currency || 'USD',
    country: companyData.country || existing?.country,
    timezone: companyData.timezone || existing?.timezone,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  };

  await db.companies.put(company);
  await logActivity('updated_company', 'system', `Updated company profile for ${company.name}`);
  return company;
}

export async function getSettings(): Promise<AppSettings> {
  let settings = await db.settings.get('singleton');
  if (!settings) {
    settings = {
      id: 'singleton',
      theme: 'dark',
      currency: 'USD',
      timezone: 'UTC',
      dateFormat: 'YYYY-MM-DD',
      demoLoaded: false,
    };
    await db.settings.put(settings);
  }
  return settings;
}

export async function updateSettings(partial: Partial<AppSettings>): Promise<AppSettings> {
  const current = await getSettings();
  const updated: AppSettings = { ...current, ...partial };
  await db.settings.put(updated);
  return updated;
}
