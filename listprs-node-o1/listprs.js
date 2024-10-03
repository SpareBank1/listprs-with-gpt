// script.js

import {
    getCurrentUsername,
    getRepositoryDetails,
    getPullRequestsByLabel,
    getPullRequestsAssignedToUser,
    getPullRequestsAuthoredByUser,
    getPullRequestsByTeams,
    combinePullRequests,
    printPullRequestsWithHeader,
} from './githubUtils.js';

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

/**
 * Hovedfunksjon for å utføre skriptets logikk.
 */
async function main() {
    const argv = yargs(hideBin(process.argv))
        .usage('Bruk: $0 <label> [teams...]')
        .demandCommand(1)
        .help()
        .argv;

    const label = argv._[0];
    const teams = argv._.slice(1);

    console.log('PRer for gjennomgang:\n');

    const { owner, repo } = getRepositoryDetails();
    const username = getCurrentUsername();

    // Hent PRer
    const pullRequestsAuthoredByUser = getPullRequestsAuthoredByUser(username);
    const pullRequestsAssignedToUser = getPullRequestsAssignedToUser(username);
    const pullRequestsByLabelAndTeams = combinePullRequests([
        getPullRequestsByLabel(label),
        getPullRequestsByTeams(teams),
    ]);

    // Fjern PRer som allerede er listet i de to første listene
    const existingPRNumbers = new Set([
        ...pullRequestsAuthoredByUser.map(pr => pr.number),
        ...pullRequestsAssignedToUser.map(pr => pr.number),
    ]);

    const pullRequestsByLabelAndTeamsFiltered = pullRequestsByLabelAndTeams.filter(
        pr => !existingPRNumbers.has(pr.number)
    );

    // Skriv ut PRer med overskrifter
    printPullRequestsWithHeader('PRer opprettet av brukeren:', pullRequestsAuthoredByUser);
    printPullRequestsWithHeader('PRer tildelt brukeren:', pullRequestsAssignedToUser);
    printPullRequestsWithHeader('PRer etter team og label:', pullRequestsByLabelAndTeamsFiltered);
}

main().catch(error => {
    console.error('Feil:', error.message);
    process.exit(1);
});
