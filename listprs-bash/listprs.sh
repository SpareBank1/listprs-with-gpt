#!/usr/bin/env bash

echo -e "PRer for review:\n"

ghusername=$(gh api user --jq '.login')
AUTHOR="$ghusername"
PERSON="$ghusername"
LABEL="$2"
shift 2
TEAMS=("$@") #The rest of the params are gh teams

# Fetch PRs by label and store in a variable
prs_by_label=$(gh pr list --label "$LABEL" --state open --json number,title,author,url,reviewRequests,createdAt | jq '.')

# Fetch PRs assigned to the person and store in a variable
prs_by_person=$(gh pr list --assignee "$PERSON" --state open --json number,title,author,url,reviewRequests,createdAt | jq '.')

# User¨s own PRs:
prs_by_author=$(gh pr list --author "$AUTHOR" --state open --json number,title,author,url,reviewRequests,createdAt | jq '.')

# Initialize a variable to store PRs by teams
prs_by_teams="[]"

# Fetch PRs for each team and combine them
for team in "${TEAMS[@]}"; do
  jqcommand="--jq '.[] | select(any(.reviewRequests[]?; .name? // "" | test($team))) | {number, title, author, url, createdAt}}'"
  prs=$(gh pr list --state open --json number,title,author,url,reviewRequests,createdAt | jq --arg team "$team" '[.[] | select(any(.reviewRequests[]?; .name? // "" | test($team))) | {number, title, author, url,createdAt}]')
  prs_by_teams=$(jq -s '.[0] + .[1]' <(echo "$prs_by_teams") <(echo "$prs"))
done

# Combine results using jq and store in a variable
combined_prs=$(jq -s '[.[][]] | unique_by(.number) | sort_by(.createdAt)' <(echo "$prs_by_teams") <(echo "$prs_by_author") <(echo "$prs_by_label") <(echo "$prs_by_person") <(echo "$prs_by_author"))

COLOR_BLUE="\033[34m"
COLOR_RESET="\033[0m"

#Print out the result:
echo -e "$combined_prs" | jq -r '.[] | "PR #" + (.number|tostring) + "\nAuthor: " + .author.login + "\nTitle: " + .title + "\nDate: " + .createdAt  + "\nURL: " + .url + "\n"'