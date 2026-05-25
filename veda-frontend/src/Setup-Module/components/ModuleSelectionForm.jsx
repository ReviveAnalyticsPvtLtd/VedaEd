import React from "react";
import { FiEdit2 } from "react-icons/fi";
import ModuleCard from "./ModuleCard";
import {
  REQUIRED_MODULES,
  OPTIONAL_MODULES,
} from "../constants/moduleSelection";

const ModuleSelectionForm = ({ enabledOptional, onToggleOptional }) => {
  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-setup-border bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="text-base font-bold text-setup-heading sm:text-lg">
              Required Core Modules
            </h3>
            <p className="mt-1 text-sm text-setup-muted">
              These modules create the minimum operating foundation for VedaSchool.
            </p>
          </div>
          <span className="inline-flex w-fit shrink-0 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
            Locked ON
          </span>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {REQUIRED_MODULES.map((module) => (
            <ModuleCard
              key={module.key}
              module={module}
              checked
              locked
            />
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-setup-border bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="text-base font-bold text-setup-heading sm:text-lg">
              Optional Modules
            </h3>
            <p className="mt-1 text-sm text-setup-muted">
              Enable what your school needs now. You can add more modules later.
            </p>
          </div>
          <span className="inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-setup-primary">
            <FiEdit2 className="h-3.5 w-3.5" aria-hidden />
            Editable Later
          </span>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {OPTIONAL_MODULES.map((module) => {
            const checked = enabledOptional.includes(module.key);
            return (
              <ModuleCard
                key={module.key}
                module={module}
                checked={checked}
                onToggle={() => onToggleOptional(module.key)}
              />
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default ModuleSelectionForm;
