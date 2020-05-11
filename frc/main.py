"""
    TODO:
        - Determine which teams have played the most events (more than 1)
        - Option view all teams participated / not.
        - Data for list of teams by state that have / have not participated

FRC Data error:
    frc135, frc3494, frc829

=-------------------------------------------------------------------=
        
    start on 'initiation line'
        can be loaded with 3 'power cell' balls
        auto for first 15 seconds
        teleop for 2:15 min
        score on opposite side of start
    
    ball ports
        low - 1
        outer - 2
        inner - 3

    'control panel' - color wheel
        rotate num - 10
        rotate to pos - 20 and 1 rp
            
    'rendezvous point' - climb
        two bots - 25 each (50)
        if level - 15
        if third bot is within climb zone - 5
        
    if total points at end game >= 65 gain 1 rp
"""

import requests
from bs4 import BeautifulSoup
import json
import pprint


class frc_event():
    teams = []
    def __init__(self, key, name, week):
        self.key = key 
        self.name = name 
        self.week = week 

    def __str__(self):
        return self.key + ": ({})".format(self.name)
    
    def __repr__(self):
        return self.__str__()


class frc_team():
    def __init__(self, key, name, state):
        self.key = key 
        self.name = name 
        self.state = state

    def __str__(self):
        return self.key + ": ({})".format(self.name)
    
    def __repr__(self):
        return self.__str__()


def tbaAPI(query):
    key = "Z37IOn5LR76k6oZX42Yj6qktALW6DNd1aoQMeUSGzf1EEq1Cf2yX9jJcjiiKGIDx" 
    url = "https://www.thebluealliance.com/api/v3/{}".format(query)
    headers = { 'X-TBA-Auth-Key' : key }
    response = requests.get(url, headers=headers)
    return response.json()


# get data from FIRST official leaderboard, incorrect data
# def getIndianaTeams(year):
#     # pull from district ranking leaderboard
#     url = "http://frc-events.firstinspires.org/{}/district/IN".format(year)
#     page = requests.get(url).content
#     soup = BeautifulSoup(page, 'html.parser')
#     rows = soup.table.find_all('tr')[1:]
#     teams = []
#     for row in rows:
#         td = row.find_all('td')
#         td = [x.text.strip() for x in td]
#         raw_name = td[2]
#         played = not (td[3] == td[4])
#         if played:
#             teams.append(frc_team('frc' + raw_name[:4].rstrip(), "", "Indiana"))
#     teamCount = len(rows) - 1 # exclude the column label row
#     return teams


# get all teams registered from a given state in a given year
def getStateTeams(state_prov, year):
    output = []
    # pull all events completed for given year as frc_event objects
    events = getAllEvents(year)
    for event in events:
        # differentiate events that took place from suspended events
        teams = tbaAPI('event/' + event.key + '/teams')
        for team in teams:
            team_obj = frc_team(team['key'], team['name'], team['state_prov'])
            if not team_obj in output:
                if team_obj.state == state_prov:
                    output.append(team_obj)
    return output


# get all teams from a given state in a given year who have competed
def getCompetedStateTeams(state_prov, year):
    output = []
    # pull all events completed for given year as frc_event objects
    events = getCompletedEvents(year)
    for event in events:
        # differentiate events that took place from suspended events
        teams = tbaAPI('event/' + event.key + '/teams')
        for team in teams:
            team_obj = frc_team(team['key'], team['name'], team['state_prov'])
            if not team_obj in output:
                if team_obj.state == state_prov:
                    output.append(team_obj)
    return output 

"""
:: Gets all teams from all events in given year
        
ERROR: repeated team_obj, maybe duplicate events?
        look into threads / parallel calls / async calls
"""
def getAllTeams(year):
    output = []
    # pull all events completed for given year as frc_event objects
    events = getAllEvents(year)
    for event in events:
        # differentiate events that took place from suspended events
        teams = tbaAPI('event/' + event.key + '/teams')
        for team in teams:
            team_obj = frc_team(team['key'], team['name'], team['state_prov'])
            if not team_obj.key in [o.key for o in output]:
                output.append(team_obj)
    return output 

# get all events scheduled for a given year
def getAllEvents(year): 
    events = tbaAPI('events/' + str(year))
    output = [frc_event(event['key'], event['name'], event['week']) for event in events]
    return output


def eventCount(year):
    return len(getAllEvents(year))


# get all completed events for a given year
def getCompletedEvents(year):
    sus_events = [] # suspended events
    com_events = [] # completed events

    # pull all events planned for 2020
    events = tbaAPI('events/' + str(year))
    for event in events:
        # differentiate events that took place from suspended events
        if 'SUSPENDED' in event['name']:
            # remove ***SUSPENDED*** and extra space from event name
            name = event['name'][16:]
            sus_events.append(frc_event(event['key'], event['name'], event['week']))
        else:
            com_events.append(frc_event(event['key'], event['name'], event['week']))
    return com_events


def getSuspendedEvents(year):
    sus_events = [] # suspended events
    com_events = [] # completed events

    # pull all events planned for 2020
    events = tbaAPI('events/2020')
    for event in events:
        # differentiate events that took place from suspended events
        if 'SUSPENDED' in event['name']:
            # remove ***SUSPENDED*** and extra space from event name
            # name = event['name'][16:]
            sus_events.append(frc_event(event['key'], event['name'], event['week']))
        else:
            com_events.append(frc_event(event['key'], event['name'], event['week']))
    return sus_events
   

if __name__ == "__main__":

    # with open('teams_w_events.json', 'w') as json_file:
    #     json.dump(output, json_file)

    # teams_dict = {}

    with open('teams_by_events.json') as file:
        teams_by_events = json.load(file)

    with open('teams_by_state.json') as file:
        teams_by_state = json.load(file)

    teams = {}

    for state in teams_by_state:
        for team in teams_by_state[state]:
            if state in teams:
                teams[state] += [team, teams_by_events[team]]
            else:
                teams[state] = [team, teams_by_events[team]]

    with open('teams_by_state_and_events.json', 'w') as file:
        json.dump(teams, file)

    pprint.pprint(teams)

    # for week in data:
    #     if week[-2:] != 'ed':
    #         print(week, len(data[week]))

    # for state in data:
    #     teams = getCompetedStateTeams(state, 2020)
    #     print(state, len(teams))
    #     data[state] += [len(teams)]

    # teams_count = {}
    # for state in teams_dict:
    #     teams_count[state] = len(teams_dict[state])

    # pprint.pprint(data)
    # with open('temp.json', 'w') as json_file:
    #     json.dump(data, json_file)


    # print(len(getStateTeams('Hawaii', 2020)))

    # pprint.pprint(getAllTeams(2020))
    #print(getStateTeams('Indiana', 2020))

    #print("Total Events Scheduled: ", len(all_events))
    #print("Total Events Suspended: ", len(sus_events))
    #print("Percent Suspended: ", round(100 * (len(sus_events) / len(all_events)), 2))
    #
    #print("Total Teams Participated: ", len(active_teams))
    #print("Total Percent Participated: ", round(100 * (len(active_teams) / total_teams), 2))
    #print("Total Indiana Teams Participated: ", len(in_teams))
