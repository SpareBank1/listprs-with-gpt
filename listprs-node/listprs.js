import githubPrs from  './githubPrs.js';

// ANSI color codes for terminal output
export const COLOR_BLUE = '\x1b[34m';
export const COLOR_RESET = '\x1b[0m';

// Main function to display PRs
export default async function displayPRsForReview(label, teams) {
    const author = await githubPrs.getGitHubUsername();
    const person = author;

    // Fetch PRs
    const prsByAuthor = await githubPrs.getPRsByAuthor(author);
    const prsByPerson = await githubPrs.getPRsByPerson(person);
    const prsByLabel = await githubPrs.getPRsByLabel(label);
    const prsByTeams = await githubPrs.getPRsByTeams(teams);

    const prsByTeamAndLabel = filterPRsNotInLists([...prsByTeams, ...prsByLabel], [...prsByAuthor, ...prsByPerson]);

    // Display sections
    console.log(COLOR_BLUE + 'PRs created by user:' + COLOR_RESET);
    displayPRList(prsByAuthor);

    console.log(COLOR_BLUE + 'PRs assigned to user:' + COLOR_RESET);
    displayPRList(prsByPerson);

    console.log(COLOR_BLUE + 'PRs by team and label:' + COLOR_RESET);
    displayPRList(prsByTeamAndLabel);
}

// A function for filtering PRs that are not already in the given lists
export function filterPRsNotInLists(prs, excludeLists) {
    const excludeSet = new Set(excludeLists.map(pr => pr.number));
    return prs.filter(pr => !excludeSet.has(pr.number));
}

// Display the PR list
export function displayPRList(prs) {
    if (prs.length === 0) {
        console.log(COLOR_BLUE + 'No PRs found.' + COLOR_RESET);
        return;
    }

    prs.forEach(pr => {
        console.log(`${COLOR_BLUE}PR #${pr.number}${COLOR_RESET}
Author: ${pr.author.login}
Title: ${pr.title}
Date: ${new Date(pr.createdAt).toLocaleDateString()}
URL: ${pr.url}
`);
    });
}

// Example usage
const label = process.argv[2];
const teams = process.argv.slice(3);
displayPRsForReview(label, teams);
