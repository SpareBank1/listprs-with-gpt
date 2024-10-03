import subprocess
import json
import argparse

def fetch_github_username():
    """Fetch the GitHub username using the GitHub CLI."""
    result = subprocess.run(['gh', 'api', 'user', '--jq', '.login'], capture_output=True, text=True, check=True)
    return result.stdout.strip()

def fetch_prs(query):
    """Fetch PRs using the GitHub CLI and return as JSON."""
    result = subprocess.run([
        'gh', 'pr', 'list', '--search', query, '--state', 'open',
        '--json', 'number,title,author,url,reviewRequests,createdAt'
    ], capture_output=True, text=True, check=True)
    return json.loads(result.stdout)

def format_pr_details(prs):
    """Format the PR details for display."""
    formatted_prs = []
    for pr in prs:
        formatted_pr = (
            f"PR #{pr['number']}\n"
            f"Author: {pr['author']['login']}\n"
            f"Title: {pr['title']}\n"
            f"Date: {pr['createdAt']}\n"
            f"URL: {pr['url']}\n"
        )
        formatted_prs.append(formatted_pr)
    return "\n".join(formatted_prs)

def fetch_prs_by_label(label):
    """Fetch PRs by label."""
    query = f'label:{label}'
    return fetch_prs(query)

def fetch_prs_by_author(author):
    """Fetch PRs by author."""
    query = f'author:{author}'
    return fetch_prs(query)

def fetch_prs_assigned_to_user(username):
    """Fetch PRs assigned to the user."""
    query = f'assignee:{username}'
    return fetch_prs(query)

def fetch_prs_assigned_to_teams(teams):
    """Fetch PRs assigned to one or more teams."""
    queries = [f'team-review-requested:sparebank1utvikling/{team}' for team in teams]
    combined_query = ' '.join(queries)
    return fetch_prs(combined_query)

def filter_out_prs(prs, prs_to_filter_out):
    """Filter out PRs from the provided list."""
    pr_numbers_to_filter_out = {pr['number'] for pr in prs_to_filter_out}
    return [pr for pr in prs if pr['number'] not in pr_numbers_to_filter_out]

def main(label = "", teams = []):
    github_username = fetch_github_username()
    print(f"GitHub Username: {github_username}")

    print("PRs for review:\n")
    # Fetch PRs created by the user
    prs_by_author = fetch_prs_by_author(github_username)
    formatted_prs_by_author = format_pr_details(prs_by_author)
    print("\nPRs created by user:\n")
    print(formatted_prs_by_author)

    # Fetch PRs assigned to the user
    prs_assigned_to_user = fetch_prs_assigned_to_user(github_username)
    formatted_prs_assigned_to_user = format_pr_details(prs_assigned_to_user)
    print("\nPRs assigned to user:\n")
    print(formatted_prs_assigned_to_user)

    prs_by_label = []
    prs_assigned_to_teams = []

    # Fetch PRs assigned to teams
    if teams:
        prs_assigned_to_teams = fetch_prs_assigned_to_teams(teams)

    # Fetch PRs by label
    if label:
        prs_by_label = fetch_prs_by_label(label)

    # Combine PRs assigned to teams and PRs by label, then filter out those already listed
    combined_prs = prs_assigned_to_teams + prs_by_label
    filtered_combined_prs = filter_out_prs(combined_prs, prs_by_author + prs_assigned_to_user)
    formatted_combined_prs = format_pr_details(filtered_combined_prs)
    print("\nPRs by label and assigned to teams:\n")
    print(formatted_combined_prs)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Fetch and display GitHub pull requests.')
    parser.add_argument('--label', type=str, help='Label to filter PRs by.')
    parser.add_argument('--teams', type=str, nargs='+', help='Teams to filter PRs assigned to.')

    args = parser.parse_args()
    main(args.label, args.teams)
