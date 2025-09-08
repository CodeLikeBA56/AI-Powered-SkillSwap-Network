import "./Settings.css";
import React, { useEffect } from "react";
import { useSettingContext } from "../../context/SettingContext";
import { useUserProfile } from "../../context/UserProfileProvider";

import Accordion from "../../components/Common/Accordion/Accordion";
import Certificates from "../../components/Certificates/Certificates";
import SetOfferedAndDesiredSkills from "./SetOfferedAndDesiredSkills";
import SessionSettings from "../../components/Settings/Session-Settings";
import AccountSettings from "../../components/Settings/Account-Settings";
import UpdateProfileForm from "../../components/Forms/UpdateProfileForm";
import SocialLinksForm from "../../components/Profile-Module/Social-Links-Form/Social-Links-Form";

const Settings = () => {
    const { userInfo } = useUserProfile();
    const { changeActiveLink } = useSettingContext();

    useEffect(() => {
        changeActiveLink('Settings');
    }, []);

  return (
    <div className="settings-screen">
        <h1>Settings</h1>
        <Accordion
            title="Personal Information"
            id="personal-info"
            children={<UpdateProfileForm />}
        />
        <Accordion
            title="Certificates"
            id="user-certificates"
            children={<Certificates userInfo={userInfo} editingRights={true} />}
        />
        <Accordion 
            title="Social Links" 
            id="social-links"
            children={<SocialLinksForm />}
        />
        <Accordion 
            title="Session Settings" 
            id="session-settings"
            children={<SessionSettings />}
        />
        <Accordion 
            title="Account Settings" 
            id="account-settings"
            children={<AccountSettings />}
        />
        <Accordion 
            title="Set Offered & Desired Skills" 
            id="set-skills"
            children={<SetOfferedAndDesiredSkills />}
        />
    </div>
  );
};

export default Settings;