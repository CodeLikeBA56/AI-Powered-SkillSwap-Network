import './Multi-Select.css';
import React, { useState } from 'react';
import image from '../../assets/No-Profile.webp';

const MultiSelect = ({ tag: TAG, suggestedOptions }) => {
    const [selectedOptions, setSelectedOptions] = useState(new Set());
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const handleOptionClick = (option) => {
        setSelectedOptions((prevSelected) => {
            const newSelected = new Set(prevSelected);
            newSelected.has(option) ? newSelected.delete(option) : newSelected.add(option);
            return newSelected;
        });
    };

    const handleRemoveOption = (option) => {
        setSelectedOptions((prevSelected) => {
            const newSelected = new Set(prevSelected);
            newSelected.delete(option);
            return newSelected;
        });
    };

    const filteredOptions = suggestedOptions.filter(option =>
        option.username.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className='custom-select'>
            <div className='select-box'>
                <ul className='selected-options'>
                    {[...selectedOptions].map((option) => (
                        <li key={option.username} className='selected-option'>
                            <TAG username={option.username} profilePicture={image} />
                            <button type='button' className='remove-option-btn' onClick={() => handleRemoveOption(option)}>
                                <span className='material-symbols-outlined'>close</span>
                            </button>
                        </li>
                    ))}
                </ul>
                <button 
                    type='button' 
                    className='drop-down-btn' 
                    onClick={() => setIsDropdownOpen((prev) => !prev)}
                >
                    <span className='material-symbols-outlined'>
                        {isDropdownOpen ? 'arrow_drop_up' : 'arrow_drop_down'}
                    </span>
                </button>
            </div>

            {isDropdownOpen && (
                <div className='options-container'>
                    <div className='options-searchbar-wrapper'>
                        <input
                            type='search'
                            className='options-searchbar'
                            placeholder='Enter your friend’s name'
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    {filteredOptions.length === 0 ? (
                        <p className="no-user-match">No user match</p>
                    ) : (
                        <ul className='options-list'>
                            {filteredOptions.map((option) => (
                                <li key={option.username} className='option' onClick={() => handleOptionClick(option)}>
                                    <TAG username={option.username} profilePicture={image} />
                                    <input type='checkbox' checked={selectedOptions.has(option)} readOnly />
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
};

export default MultiSelect;