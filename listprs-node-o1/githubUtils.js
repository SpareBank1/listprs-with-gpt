// githubUtils.js

import { execSync } from 'child_process';

/**
 * Utfører en kommando og returnerer den parsede JSON-utdataen.
 * @param {string} command - Kommandoen som skal utføres.
 * @returns {Object} - Den parsede JSON-utdataen.
 */
function execGhCommand(command) {
    try {
        const output = execSync(command, { encoding: 'utf-8' });
        return JSON.parse(output);
    } catch (error) {
        console.error('Feil ved utførelse av kommando:', command);
        console.error(error.message);
        process.exit(1);
    }
}

/**
 * Henter brukernavnet til den nåværende autentiserte GitHub-brukeren.
 * @returns {string} - Brukernavnet til den autentiserte brukeren.
 */
function getCurrentUsername() {
    const userData = execGhCommand('gh api user');
    return userData.login;
}

/**
 * Henter eier og navn på repositoriet fra git remote URL.
 * @returns {Object} - Et objekt som inneholder eier og repo-navn.
 */
function getRepositoryDetails() {
    try {
        const remoteUrl = execSync('git config --get remote.origin.url', { encoding: 'utf-8' }).trim();
        const match = remoteUrl.match(/github\.com[:\/](.+)\/(.+)\.git/);
        if (match) {
            const owner = match[1];
            const repo = match[2];
            return { owner, repo };
        } else {
            throw new Error('Kan ikke parse repository owner og navn fra remote URL');
        }
    } catch (error) {
        console.error('Feil ved henting av repository-detaljer:', error.message);
        process.exit(1);
    }
}

/**
 * Henter åpne pull requests med en spesifikk label.
 * @param {string} label - Label for å filtrere pull requests.
 * @returns {Array} - En liste av pull requests.
 */
function getPullRequestsByLabel(label) {
    const command = `gh pr list --label "${label}" --state open --json number,title,author,url,reviewRequests,createdAt`;
    return execGhCommand(command);
}

/**
 * Henter åpne pull requests tildelt en spesifikk bruker.
 * @param {string} username - Brukernavn for å filtrere pull requests.
 * @returns {Array} - En liste av pull requests.
 */
function getPullRequestsAssignedToUser(username) {
    const command = `gh pr list --assignee "${username}" --state open --json number,title,author,url,reviewRequests,createdAt`;
    return execGhCommand(command);
}

/**
 * Henter åpne pull requests opprettet av en spesifikk bruker.
 * @param {string} username - Brukernavn for å filtrere pull requests.
 * @returns {Array} - En liste av pull requests.
 */
function getPullRequestsAuthoredByUser(username) {
    const command = `gh pr list --author "${username}" --state open --json number,title,author,url,reviewRequests,createdAt`;
    return execGhCommand(command);
}

/**
 * Henter åpne pull requests hvor noen av de spesifiserte teamene er forespurte reviewere.
 * @param {Array<string>} teams - Liste av team-slugs for å filtrere pull requests.
 * @returns {Array} - En liste av pull requests.
 */
function getPullRequestsByTeams(teams) {
    if (teams.length === 0) return [];

    const command = `gh pr list --state open --json number,title,author,url,reviewRequests,createdAt`;
    const allPrs = execGhCommand(command);

    // Filtrer PRer hvor noen av teamene er forespurte reviewere
    return allPrs.filter(pr => {
        const requestedTeams = pr.reviewRequests?.teams || [];
        const teamSlugs = requestedTeams.map(team => team.slug);
        return teams.some(team => teamSlugs.includes(team));
    });
}

/**
 * Kombinerer flere lister av pull requests og fjerner duplikater.
 * @param {Array<Array>} pullRequestLists - En array av pull request-lister.
 * @returns {Array} - En kombinert liste av pull requests uten duplikater.
 */
function combinePullRequests(pullRequestLists) {
    const pullRequestMap = new Map();

    pullRequestLists.forEach(list => {
        list.forEach(pr => {
            pullRequestMap.set(pr.number, pr);
        });
    });

    return Array.from(pullRequestMap.values());
}

/**
 * Skriver ut pull requests med en overskrift.
 * @param {string} header - Overskriften som skal skrives ut.
 * @param {Array} pullRequests - En liste av pull requests som skal skrives ut.
 */
function printPullRequestsWithHeader(header, pullRequests) {
    if (pullRequests.length === 0) {
        console.log(`${header}\nIngen PRer funnet.\n`);
        return;
    }

    console.log(`${header}\n`);
    pullRequests.forEach(pr => {
        console.log(`PR #${pr.number}`);
        console.log(`Forfatter: ${pr.author.login}`);
        console.log(`Tittel: ${pr.title}`);
        console.log(`Dato: ${pr.createdAt}`);
        console.log(`URL: ${pr.url}\n`);
    });
}

export {
    getCurrentUsername,
    getRepositoryDetails,
    getPullRequestsByLabel,
    getPullRequestsAssignedToUser,
    getPullRequestsAuthoredByUser,
    getPullRequestsByTeams,
    combinePullRequests,
    printPullRequestsWithHeader,
};
