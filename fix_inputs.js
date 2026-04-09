const fs = require('fs');
const path = require('path');

const filePath = path.join('d:', 'Antigraviity', 'Tracking system', 'frontend', 'src', 'pages', 'AdminDashboard.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// Refactor state
content = content.replace(
    /const \[projectForm, setProjectForm\] = useState\(\{[\s\S]*?\}\);/,
    `const [newProjectName, setNewProjectName] = useState('');
  const [newProjectKey, setNewProjectKey] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [newProjectLead, setNewProjectLead] = useState('');
  const [newProjectDeadline, setNewProjectDeadline] = useState('');
  const [showCreateProjectModal, setShowCreateProjectModal] = useState(false);`
);

// Refactor inputs using regex to be whitespace-agnostic
content = content.replace(
    /value=\{projectForm\.projectName\}[\s\S]*?onChange=\{e => setProjectForm\(\{\.\.\.projectForm, projectName: e\.target\.value\}\)\}/,
    'value={newProjectName} onChange={e => setNewProjectName(e.target.value)}'
);

content = content.replace(
    /value=\{projectForm\.projectKey\}[\s\S]*?onChange=\{e => setProjectForm\(\{\.\.\.projectForm, projectKey: e\.target\.value\.toUpperCase\(\)\}\)\}/,
    'value={newProjectKey} onChange={e => setNewProjectKey(e.target.value.toUpperCase())}'
);

content = content.replace(
    /value=\{projectForm\.description\}[\s\S]*?onChange=\{e => setProjectForm\(\{\.\.\.projectForm, description: e\.target\.value\}\)\}/,
    'value={newProjectDescription} onChange={e => setNewProjectDescription(e.target.value)}'
);

content = content.replace(
    /value=\{projectForm\.lead\} onChange=\{e => setProjectForm\(\{\.\.\.projectForm, lead: e\.target\.value\}\)\}/,
    'value={newProjectLead} onChange={e => setNewProjectLead(e.target.value)}'
);

content = content.replace(
    /value=\{projectForm\.deadline\} onChange=\{e => setProjectForm\(\{\.\.\.projectForm, deadline: e\.target\.value\}\)\}/,
    'value={newProjectDeadline} onChange={e => setNewProjectDeadline(e.target.value)}'
);

// Add focus-debug class to all inputs
content = content.replace(/className="form-input"/g, 'className="form-input focus-debug"');
content = content.replace(/className="form-textarea"/g, 'className="form-textarea focus-debug"');
content = content.replace(/className="form-select"/g, 'className="form-select focus-debug"');

fs.writeFileSync(filePath, content);
console.log('✅ AdminDashboard.jsx refactored with individual states and focus-debug.');
