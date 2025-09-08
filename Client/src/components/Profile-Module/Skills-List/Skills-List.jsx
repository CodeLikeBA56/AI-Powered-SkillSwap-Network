import './Skills-List.css';

const SkillsList = ({title, skills, removeSkill, allowDeletionRights}) => {
    return (
        <>
            <h4 className='heading'>{title}</h4>
            <ul className='skills-set'>
                {skills?.map((skill, index) => (
                    <li key={index}>
                        <span>{skill}</span>
                        { true == allowDeletionRights && <button type='button' onClick={() => removeSkill(skill, index)}><span className='material-symbols-outlined'>close</span></button> }
                    </li>
                ))}
            </ul>
        </>
    );
};

export default SkillsList;