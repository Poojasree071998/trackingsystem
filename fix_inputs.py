import os

path = r'd:\Antigraviity\Tracking system\frontend\src\pages\AdminDashboard.jsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Refactor state
content = content.replace(
    "const [projectForm, setProjectForm] = useState({",
    "const [newProjectName, setNewProjectName] = useState('');\n  const [newProjectKey, setNewProjectKey] = useState('');\n  const [newProjectDescription, setNewProjectDescription] = useState('');\n  const [newProjectLead, setNewProjectLead] = useState('');\n  const [newProjectDeadline, setNewProjectDeadline] = useState('');\n  const [projectFormHidden, setProjectForm] = useState({"
)

# Refactor handler
old_handler = """  const handleCreateProject = async (e) => {
    e.preventDefault();
    try {
      if (!API_BASE_URL && window.location.hostname !== 'localhost') {
        throw new Error('Project deployment is missing API configuration. Please set VITE_API_BASE_URL.');
      }
      await axios.post(`${API_BASE_URL}/api/projects`, projectForm);
      setProjectForm({ projectName: '', projectKey: '', description: '', lead: '', projectType: 'Software Project', priority: 'Medium', deadline: '' });
      setShowCreateProjectModal(false);
      fetchData();"""

new_handler = """  const handleCreateProject = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        projectName: newProjectName,
        projectKey: newProjectKey,
        description: newProjectDescription,
        lead: newProjectLead,
        deadline: newProjectDeadline,
        projectType: 'Software Project',
        priority: 'Medium'
      };
      await axios.post(`${API_BASE_URL}/api/projects`, payload);
      setNewProjectName(''); setNewProjectKey(''); setNewProjectDescription(''); setNewProjectLead(''); setNewProjectDeadline('');
      setShowCreateProjectModal(false);
      fetchData();"""

content = content.replace(old_handler, new_handler)

# Refactor inputs
# Name
content = content.replace(
    'value={projectForm.projectName} \n                        onChange={e => setProjectForm({...projectForm, projectName: e.target.value})} ',
    'value={newProjectName} \n                        onChange={e => setNewProjectName(e.target.value)} \n                        className="form-input focus-debug" '
)

# Key
content = content.replace(
    'value={projectForm.projectKey} \n                        onChange={e => setProjectForm({...projectForm, projectKey: e.target.value.toUpperCase()})} ',
    'value={newProjectKey} \n                        onChange={e => setNewProjectKey(e.target.value.toUpperCase())} \n                        className="form-input focus-debug" '
)

# Desc
content = content.replace(
    'value={projectForm.description} \n                    onChange={e => setProjectForm({...projectForm, description: e.target.value})} ',
    'value={newProjectDescription} \n                    onChange={e => setNewProjectDescription(e.target.value)} \n                    className="form-textarea focus-debug" '
)

# Lead
content = content.replace(
    'value={projectForm.lead} onChange={e => setProjectForm({...projectForm, lead: e.target.value})}',
    'value={newProjectLead} onChange={e => setNewProjectLead(e.target.value)} className="form-select focus-debug"'
)

# Deadline
content = content.replace(
    'value={projectForm.deadline} onChange={e => setProjectForm({...projectForm, deadline: e.target.value})}',
    'value={newProjectDeadline} onChange={e => setNewProjectDeadline(e.target.value)} className="form-input focus-debug"'
)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
