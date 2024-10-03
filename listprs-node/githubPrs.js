import { exec } from 'child_process';
import util from 'util';

const execPromise = util.promisify(exec);

// Fetch PRs authored by the user
async function getPRsByAuthor(author) {
    const command = `gh pr list --author "${author}" --state open --json number,title,author,url,createdAt`;
    const { stdout } = await execPromise(command);
    return JSON.parse(stdout);
}

// Fetch PRs assigned to a specific person
async function getPRsByPerson(person) {
    const command = `gh pr list --assignee "${person}" --state open --json number,title,author,url,createdAt`;
    const { stdout } = await execPromise(command);
    return JSON.parse(stdout);
}

// Fetch PRs by label
async function getPRsByLabel(label) {
    const command = `gh pr list --label "${label}" --state open --json number,title,author,url,createdAt`;
    const { stdout } = await execPromise(command);
    return JSON.parse(stdout);
}

// Fetch PRs requested by teams
async function getPRsByTeams(teams) {
    let prsByTeams = [];
    for (const team of teams) {
        const command = `gh pr list --state open --json number,title,author,url,createdAt | jq --arg team "${team}" '[.[] | select(any(.reviewRequests[]?; .name? // "" | test($team))) | {number, title, author, url,createdAt}]'`;
        const { stdout } = await execPromise(command);
        prsByTeams = [...prsByTeams, ...JSON.parse(stdout)];
    }
    return prsByTeams;
}

// Mocked for simplicity, fetches GitHub username
async function getGitHubUsername() {
    return 'vidarmoe'; // Just a dummy username for this example
}

export default {
    getPRsByAuthor,
    getPRsByPerson,
    getPRsByLabel,
    getPRsByTeams,
    getGitHubUsername
};
