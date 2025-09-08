import './Accordion.css';

const Accordion = ({ title, id, children }) => {
    return (
        <div className="accordion">
            <input type="checkbox" id={id} className="accordion-checkbox" hidden />

            <label htmlFor={id} className="accordion-header">
                <h2 className="accordion-title">{title}</h2>
                <span className="material-symbols-outlined">keyboard_arrow_down</span>
            </label>

            <div className="accordion-body">{children}</div>
        </div>
    );
};

export default Accordion;