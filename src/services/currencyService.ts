import * as Localization from 'expo-localization';

export interface UserCurrencyInfo {
  currencyCode: string;
  currencySymbol: string;
  locale: string;
}

export const currencyService = {
  getCurrencyInfo(): UserCurrencyInfo {
    try {
      const locales = Localization.getLocales();
      if (locales && locales.length > 0) {
        const primary = locales[0];
        const currencyCode = primary.currencyCode || 'USD';
        const currencySymbol = primary.currencySymbol || '$';
        const locale = primary.languageTag || 'en-US';
        return { currencyCode, currencySymbol, locale };
      }
    } catch (e) {
      console.warn('Could not retrieve locale info:', e);
    }

    return {
      currencyCode: 'USD',
      currencySymbol: '$',
      locale: 'en-US',
    };
  },

  formatMoney(amount: number): string {
    const info = this.getCurrencyInfo();
    try {
      if (typeof Intl !== 'undefined' && Intl.NumberFormat) {
        return new Intl.NumberFormat(info.locale, {
          style: 'currency',
          currency: info.currencyCode,
          maximumFractionDigits: 0,
        }).format(amount);
      }
    } catch {
      // Fallback formatting
    }
    return `${info.currencySymbol}${amount}`;
  },
};

