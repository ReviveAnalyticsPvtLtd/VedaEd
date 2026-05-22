import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ensureOptionInList,
  findCountryByNameOrCode,
  formatCurrencyLabel,
  getCurrencyOptionsForCountry,
  getDefaultsForCountry,
  getPrimaryCurrencyCode,
  getStatesForCountry,
  getTimezonesForCountry,
  loadAllCountries,
} from "../services/localizationData";

/**
 * Dynamic country / state / timezone / currency options for Step 3.
 * Keeps `form.country` as human-readable name for backend compatibility.
 */
export function useLocalizationOptions(form, { enabled = true } = {}) {
  const [countriesLoading, setCountriesLoading] = useState(true);
  const [statesLoading, setStatesLoading] = useState(false);
  const [countryCode, setCountryCode] = useState("");
  const [stateOptions, setStateOptions] = useState([]);
  const [timezoneOptions, setTimezoneOptions] = useState([]);
  const [currencyOptions, setCurrencyOptions] = useState([]);

  const countryOptions = useMemo(() => {
    if (!enabled) return [];
    return loadAllCountries();
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return undefined;
    const timer = setTimeout(() => setCountriesLoading(false), 0);
    return () => clearTimeout(timer);
  }, [enabled]);

  const loadCountryDependencies = useCallback((isoCode, savedState, savedTimezone, savedCurrency) => {
    if (!isoCode) {
      setStateOptions([]);
      setTimezoneOptions([]);
      setCurrencyOptions([]);
      return;
    }

    setStatesLoading(true);
    try {
      const states = getStatesForCountry(isoCode);
      const timezones = getTimezonesForCountry(isoCode);
      const currencies = getCurrencyOptionsForCountry(isoCode);

      setStateOptions(
        ensureOptionInList(states, savedState, savedState)
      );
      setTimezoneOptions(
        ensureOptionInList(timezones, savedTimezone, savedTimezone)
      );
      setCurrencyOptions(
        ensureOptionInList(currencies, savedCurrency, savedCurrency)
      );
    } finally {
      setStatesLoading(false);
    }
  }, []);

  /** Sync dropdown data when form is prefilled from API */
  useEffect(() => {
    if (!enabled || countriesLoading) return;

    const match = findCountryByNameOrCode(form.country);
    if (match) {
      setCountryCode(match.isoCode);
      loadCountryDependencies(
        match.isoCode,
        form.state,
        form.timezone,
        form.currency
      );
    } else if (!form.country) {
      setCountryCode("");
      setStateOptions([]);
      setTimezoneOptions([]);
      setCurrencyOptions([]);
    } else {
      setCountryCode("");
      setTimezoneOptions(
        ensureOptionInList([], form.timezone, form.timezone)
      );
      setCurrencyOptions(
        ensureOptionInList([], form.currency, form.currency)
      );
      setStateOptions([]);
    }
  }, [
    enabled,
    countriesLoading,
    form.country,
    form.state,
    form.timezone,
    form.currency,
    loadCountryDependencies,
  ]);

  const applyCountrySelection = useCallback(
    (isoCode) => {
      const country = countryOptions.find((c) => c.isoCode === isoCode);
      if (!country) return null;

      const defaults = getDefaultsForCountry(isoCode);
      const states = getStatesForCountry(isoCode);
      const timezones = getTimezonesForCountry(isoCode);
      const currencies = getCurrencyOptionsForCountry(isoCode);

      setCountryCode(isoCode);
      setStateOptions(states);
      setTimezoneOptions(timezones);
      setCurrencyOptions(currencies);

      const currency =
        defaults.currency ||
        (getPrimaryCurrencyCode(isoCode)
          ? formatCurrencyLabel(getPrimaryCurrencyCode(isoCode))
          : "");

      return {
        countryName: country.name,
        state: "",
        timezone: defaults.timezone,
        currency,
      };
    },
    [countryOptions]
  );

  const hasStates = stateOptions.length > 0;

  return {
    countriesLoading,
    statesLoading,
    countryCode,
    countryOptions,
    stateOptions,
    timezoneOptions,
    currencyOptions,
    hasStates,
    applyCountrySelection,
    findCountryByNameOrCode,
  };
}
