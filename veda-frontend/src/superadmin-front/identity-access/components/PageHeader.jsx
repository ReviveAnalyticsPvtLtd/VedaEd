import { Link } from "react-router-dom";

export default function PageHeader({
  breadcrumbs = [],
  title,
  subtitle,
  action,
}) {
  return (
    <div className="mb-6">
      {breadcrumbs.length > 0 && (
        <p className="text-sm text-gray-500 mb-2">
          {breadcrumbs.map((crumb, i) => (
            <span key={crumb.label}>
              {crumb.to ? (
                <Link to={crumb.to} className="hover:text-indigo-600">
                  {crumb.label}
                </Link>
              ) : (
                <span>{crumb.label}</span>
              )}
              {i < breadcrumbs.length - 1 && " > "}
            </span>
          ))}
        </p>
      )}
      <div className="flex flex-wrap justify-between items-start gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-1 max-w-2xl">{subtitle}</p>
          )}
        </div>
        {action}
      </div>
    </div>
  );
}
