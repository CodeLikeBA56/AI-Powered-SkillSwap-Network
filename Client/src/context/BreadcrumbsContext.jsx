import { createContext, useContext, useState, useEffect } from "react";

export const BreadcrumbsContext = createContext();

const BreadcrumbsProvider = ({ children }) => {
    const [breadcrumbs, setBreadcrumbs] = useState(() => {
        const storedBreadcrumbs = localStorage.getItem("breadcrumbs");
        return storedBreadcrumbs ? JSON.parse(storedBreadcrumbs) : [];
    });

    useEffect(() => {
        localStorage.setItem("breadcrumbs", JSON.stringify(breadcrumbs));
    }, [breadcrumbs]);

    const resetBreadcrumbs = () => {
        setBreadcrumbs([]);
        localStorage.removeItem("breadcrumbs");
    };

    const addBreadcrumb = (newBreadcrumb) => {
        setBreadcrumbs((prev) => {
            const updatedBreadcrumbs = [...prev, newBreadcrumb];
            localStorage.setItem("breadcrumbs", JSON.stringify(updatedBreadcrumbs));
            return updatedBreadcrumbs;
        });
    };

    const removeBreadcrumb = (href) => {
        setBreadcrumbs((prev) => {
            const updatedBreadcrumbs = prev.filter((breadcrumb) => breadcrumb.href !== href);
            localStorage.setItem("breadcrumbs", JSON.stringify(updatedBreadcrumbs));
            return updatedBreadcrumbs;
        });
    };

    const removeLastBreadcrumb = () => {
        setBreadcrumbs((prev) => {
            const updatedBreadcrumbs = prev.slice(0, -1); // removes last item
            localStorage.setItem("breadcrumbs", JSON.stringify(updatedBreadcrumbs));
            return updatedBreadcrumbs;
        });
    };
    

    return (
        <BreadcrumbsContext.Provider value={{ breadcrumbs, addBreadcrumb, removeBreadcrumb, removeLastBreadcrumb, resetBreadcrumbs }}>
            {children}
        </BreadcrumbsContext.Provider>
    );
};

export const useBreadcrumbsContext = () => useContext(BreadcrumbsContext);

export default BreadcrumbsProvider;