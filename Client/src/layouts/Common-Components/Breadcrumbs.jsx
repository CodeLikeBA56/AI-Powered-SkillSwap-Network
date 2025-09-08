import React from "react";
import "./Breadcrumbs.css";
import { Link } from "react-router-dom";
import { useBreadcrumbsContext } from '../../context/BreadcrumbsContext';

const Breadcrumbs = () => {
    const { breadcrumbs } = useBreadcrumbsContext();

    return (
        <div className="breadcrumbs">
            {breadcrumbs.map((link, index) => (
                <span key={index} className="breadcrumb">
                    {link.href && link.href !== "#" ? (
                        <Link to={link.href} state={{ [link?.stateName]: link?.stateData }}>{link.label}</Link>
                    ) : (
                        <span className="inactive-breadcrumb">{link.label}</span>
                    )}
                    {index < breadcrumbs.length - 1 && <span>/</span>}
                </span>
            ))}
        </div>
    );
};

export default Breadcrumbs;