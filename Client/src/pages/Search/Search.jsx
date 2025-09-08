import './Search.css';
import axiosInstance from '../../api/axios';
import { useNavigate } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import SuggestedGroupCard from './SuggestedGroupCard.jsx';
import { useSettingContext } from '../../context/SettingContext.jsx';
import { useBreadcrumbsContext } from '../../context/BreadcrumbsContext';
import { useRecommendation } from '../../context/RecommendationProvider.jsx';
import UserCard from '../../components/Profile-Module/User-Card/User-Card.jsx';

const Search = () => {
    const { changeActiveLink } = useSettingContext();
    const { suggestedUsers, suggestedGroups } = useRecommendation();
    const { addBreadcrumb, resetBreadcrumbs } = useBreadcrumbsContext();
    
    useEffect(() => changeActiveLink('Search'), []);

    const navigate = useNavigate();
    const [searchByName, setSearchByName] = useState('');
    const [searchType, setSearchType] = useState("users");
    const [searchResult, setSearchResult] = useState([]);
    const [groupSearchResult, setGroupSearchResult] = useState([]);
    const [filterBySkills, setFilterBySkills] = useState('');

    const handleProfileClick = (user) => {
        resetBreadcrumbs();
        addBreadcrumb({ href: "/dashboard/search", label: "Search" });
        navigate('/dashboard/user-profile', { state: { user } });
        addBreadcrumb({ href: "#", label: `${user.username}'s Profile` });
    };

    useEffect(() => {
        if (searchType !== "users") return;
        if (!searchByName.trim() && !filterBySkills.trim()) {
            setSearchResult([]);
            return;
        }
    
        const controller = new AbortController();
    
        const fetchData = async () => {
            try {
                const offeredSkills = filterBySkills.split(",").map(skill => skill.trim());
                const response = await axiosInstance.post(
                    `/api/recommendations/fetch-users-by-name-or-email-or-skills/${searchByName}`,
                    { offeredSkills }, { signal: controller.signal }
                );
    
                if (response.status === 200) {
                    const { users } = response.data;
                    setSearchResult(users || []);                 
                }
            } catch (error) {
                if (error.name !== 'CanceledError') {
                    console.error('Search failed:', error.message);
                }
            }
        };
    
        const delayDebounce = setTimeout(fetchData, 600);
        return () => {
            controller.abort();
            clearTimeout(delayDebounce);
        }
    }, [searchByName, filterBySkills]);    

    useEffect(() => {
        if (searchType !== "groups") return;
        if (!searchByName.trim() && !filterBySkills.trim()) {
            setGroupSearchResult([]);
            return;
        }
    
        const controller = new AbortController();
    
        const fetchData = async () => {
            try {
                const hashtags = filterBySkills.split(",").map(hashtag => hashtag.trim());
                const response = await axiosInstance.post(
                    `/api/recommendations/fetch-groups-by-name-or-hashtags/${searchByName}`,
                    { hashtags }, { signal: controller.signal }
                );
    
                if (response.status === 200) {
                    const { groups } = response.data;
                    setGroupSearchResult(groups || []);                 
                }
            } catch (error) {
                if (error.name !== 'CanceledError') {
                    console.error('Search failed:', error.message);
                }
            }
        };
    
        const delayDebounce = setTimeout(fetchData, 600);
        return () => {
            controller.abort();
            clearTimeout(delayDebounce);
        }
    }, [searchByName, filterBySkills]);    

    return (
        <div className='search-screen'>
            <header className='search-header'>
                <div className='search-component-container'>
                    <label htmlFor='search-type'>Search Type</label>
                    <select className='search-type' id='search-type' value={searchType} onChange={(e) => setSearchType(e.target.value)}>
                        <option value='users'>Users</option>
                        <option value='groups'>Groups</option>
                    </select>
                </div>

                <div className='search-component-container'>
                    <label htmlFor='search-by-name'>
                        { searchType === "users" ? "Search user by name or email" : "Search group by name" }
                    </label>
                    <input
                        type='text'
                        id='search-by-name'
                        value={searchByName}
                        placeholder='Search...'
                        className='searchbar'
                        onChange={(e) => setSearchByName(e.target.value)}
                    />
                </div>

                <div className='search-component-container'>
                    <label htmlFor='search-by-name'>
                        {searchType === "users" ? "Filter users by skills" : "Filter groups by hashtags"}
                    </label>
                    <input
                        type='text'
                        id='search-by-name'
                        value={filterBySkills}
                        placeholder='React.js, Next.js, Express.js, MongoDB'
                        className='searchbar'
                        onChange={(e) => setFilterBySkills(e.target.value)}
                    />
                    <span className='search-guidance-msg'>Enter skills separated by commas.</span>
                </div>
                
                {/* <button className='search-btn'>
                    <span className='material-symbols-outlined'>search</span>
                </button> */}
            </header>

            <h2 className='suggested-legend'>Suggested Users</h2>
            
            <div className='suggested-users'>
                {searchResult.length > 0 ? (
                    searchResult.map(user => (
                        <UserCard user={user} redirectToProfile={handleProfileClick} key={user._id} />
                    ))
                ) : suggestedUsers.length > 0 ? (
                    suggestedUsers.map(user => (
                        <UserCard user={user} redirectToProfile={handleProfileClick} key={user._id} />
                    ))
                ) : (
                    <p className="no-results">No suggested users found.</p>
                )}
            </div>

            <h2 className='suggested-legend'>Suggested Groups</h2>
            <div className='suggested-users'>
                {
                    groupSearchResult.length > 0 ? (
                        groupSearchResult.map(group => <SuggestedGroupCard group={group} />)
                    ) : suggestedGroups.length > 0 ? (
                        suggestedGroups.map(group => <SuggestedGroupCard group={group} />)
                    ) : (
                        <p className="no-results">No suggested users found.</p>
                    )
                }
            </div>
        </div>
    );
};

export default Search;