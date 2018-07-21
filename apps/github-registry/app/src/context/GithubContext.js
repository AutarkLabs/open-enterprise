import React, { Component, createContext } from "react";
// import PropTypes from "prop-types";
// import { GraphQLClient } from "graphql-request";
// const octokit = require('@octokit/rest')({
//  debug: true
// })

export const GithubContext = createContext();
export const GithubConsumer = GithubContext.Consumer;
export class GithubProvider extends Component {
  // TODO: propTypes
  //   static propTypes = {
  //     onHandleAddRepos: PropTypes.func.isRequired,
  //     onHandleGitHubAuth: PropTypes.func.isRequired,
  //     github: PropTypes.object.isRequired
  //   };

  state = {
    authToken: "",
    login: "",
    avatarUrl: "",
    isAuthenticated: "true",
    activeRepo: "",
    activeLabel: "",
    activeMilestone: "",
    reposToAdd: {},
    reposFromServer: {},
    reposManaged: {}, // to be populated from contract or git backend itself,
    err: ""
    //    reposManaged: getPreprocessedRepos(), // to be populated from contract or git backend itself
  };

  render() {
    return (
      <GithubContext.Provider value={this.state}>
        {this.props.children}
      </GithubContext.Provider>
    );
  }
}

export const withGithub = Component => props => (
  <GithubConsumer>
    {github => <Component {...props} github={github} />}
  </GithubConsumer>
);

// <App> needs to know what repo is selected, because selection matters on multiple screens
//   handleRepoSelect = repoId => {
//     //console.log('top handleRepoSelect: ' + repoId)
//     const { github } = this.state;
//     github.activeRepo = repoId;
//     this.setState({
//       github: github,
//       activeTabId: 2 // because selecting a repo shows Issues
//     });
//   };

// this probably needs to be limited to Issues screen
//   handleLabelSelect = labelName => {
//     const { github } = this.state;
//     github.activeLabelName = labelName;
//     this.setState({ github: github });
//   };

//   handleMilestoneSelect = milestoneName => {
//     const { github } = this.state;
//     github.activeMilestoneName = milestoneName;
//     this.setState({ github: github });
//   };

//   handleAddRepos = reposToAdd => {
//     const { github } = this.state;

//     Object.keys(reposToAdd).forEach(repoId => {
//       var repo = reposToAdd[repoId];
//       if (repoId in github.reposManaged) {
//         console.log("already in: " + repo.name);
//       } else {
//         console.log("adding: " + repo.name);
//         github.reposManaged[repoId] = repo;
//       }
//     });
//   };

//   handleCreateProject = () => {
//     const { name, description, repoURL, bountySystem } = this.state;
//     alert(
//       "creating: " +
//         name +
//         ", " +
//         description +
//         ", " +
//         repoURL +
//         ", " +
//         bountySystem
//     );
//   };

//   getRepos = (client, login) => {
//     const query =
//       `{
//           user(login:"` +
//       login +
//       `") {
//             repositories(first:20,affiliations:[OWNER,COLLABORATOR,ORGANIZATION_MEMBER]) {
//               edges {
//                 node {
//                   id
//                   name
//                   description
//                   owner {
//                     id
//                     login
//                   }
//                   refs (first:10,refPrefix: "refs/heads/"){
//                     edges {
//                       node {
//                         name
//                         target {
//                           ... on Commit {
//                             history(first: 0) {
//                               totalCount
//                             }
//                           }
//                         }
//                       }
//                     }
//                   }
//                   issues(first:10) {
//                     totalCount
//                     edges {
//                       node {
//                         id
//                         title
//                         state
//                         url
//                         createdAt
//                         number
//                         repository {
//                           id
//                           name
//                           nameWithOwner
//                         }
//                         milestone {
//                           id
//                           title
//                           url
//                           description
//                         }
//                         labels(first: 10) {
//                           totalCount
//                           edges {
//                             node {
//                               id
//                               name
//                               description
//                               color
//                               url
//                             }
//                           }
//                         }
//                       }
//                     }
//                   }
//                   collaborators(first:1) {
//                     totalCount
//                   }
//                 }
//               }
//             }
//           }
//         }`;

//     client
//       .request(query)
//       .then(data => {
//         console.log(data);
//         this.processRepos(data);
//       })
//       .catch(err => this.setState({ err: err.message }));
//   };

/*

For each chosen repo Issues should be downloaded separately.
However, for simplicity's sake, and thanks to graphql, downloading
repositories with issues list included is not going to cost much.

  getIssues = (client, repoName, ownerLogin) => {
    const query = `{
      repository(owner: "` + ownerLogin + `", name: "` + repoName + `") {
        id
        issues(first: 3) {
          totalCount
          edges {
            node {
              id
              title
              state
              url
              labels(first: 10) {
                totalCount
                edges {
                  node {
                    id
                    name
                    description
                    color
                    url
                  }
                }
              }
            }
          }
        }
      }
    }`

    client.request(query)
      .then(data => {
        console.log(data)
        this.processIssues(data)
      })
      .catch(err => this.setState({ err: err.message }))
  }
*/

//   processRepos(data) {
//     var reposFromServer = {};
//     // this is a placeholder just to have the bounties work in the simplest fashion.
//     const BountyLabels = {};

//     data.user.repositories.edges.forEach(rNode => {
//       var commits = 0;
//       rNode.node.refs.edges.forEach(refNode => {
//         commits += refNode.node.target.history.totalCount;
//       });

//       const labels = {};
//       const milestones = {};

//       rNode.node.issues.edges.forEach(issue => {
//         if (issue.node.labels.totalCount > 0) {
//           issue.node.labels.edges.forEach(label => {
//             if (label.node.name in BountyLabels) {
//               issue.bounty = BountyLabels[label.node.name];
//             } else {
//               labels[label.node.id] = label.node;
//             }
//           });
//         }
//         if (issue.node.milestone) {
//           milestones[issue.node.milestone.id] = issue.node.milestone;
//         }
//         if (!("bounty" in issue)) {
//         }
//       });
//       reposFromServer[rNode.node.id] = {
//         name: rNode.node.name,
//         description: rNode.node.description,
//         collaborators: rNode.node.collaborators.totalCount,
//         commits: commits,
//         ownerLogin: rNode.node.owner.login,
//         issues: rNode.node.issues.edges,
//         labels: labels,
//         milestones: milestones
//       };
//       //console.log ('adding ' + rNode.node.name, reposFromServer)
//       //console.log('labels: ',labels)
//       //console.log('milestones: ',milestones)
//       return;
//     });
//     this.setState({ reposFromServer: reposFromServer });
//   }

//   handleLogin = event => {
//     event.preventDefault();

//     const { authToken } = this.state;
//     if (authToken.length !== 40 || /^[a-zA-Z0-9]+$/.test(authToken) === false) {
//       this.setState({ err: "Invalid token" });
//       return;
//     }

//     const client = new GraphQLClient("https://api.github.com/graphql", {
//       headers: {
//         Authorization: "Bearer " + authToken
//       }
//     });

// const whoami = `{
//   viewer {
//     id
//     login
//     avatarUrl
//   }
// }`;

//     client
//       .request(whoami)
//       .then(data => {
//         console.log(data);
//         const { onHandleGitHubAuth } = this.props;
//         this.getRepos(client, data.viewer.login);
//         // below: <App> is getting notified about successful login
//         onHandleGitHubAuth(authToken, data.viewer.login, data.viewer.avatarUrl);
//       })
//       .catch(err => this.setState({ err: err.message }));
//   };

//   handleReposSubmit = event => {
//     event.preventDefault();
//     const { onHandleAddRepos } = this.props;
//     const { reposToAdd } = this.state;
//     onHandleAddRepos(reposToAdd);
//   };

//   generateCheckboxHandler = repoId => {
//     return isChecked => {
//       const { reposToAdd, reposFromServer } = this.state;
//       if (isChecked) {
//         reposToAdd[repoId] = reposFromServer[repoId];
//         this.setState({ reposToAdd: reposToAdd });
//       } else {
//         delete reposToAdd[repoId];
//         this.setState({ reposToAdd: reposToAdd });
//       }
//     };
//   };

//   showRepos() {
// var reposDisplayList = [];
// const { reposFromServer, reposManaged, reposToAdd } = this.state;

// Object.keys(reposFromServer).forEach(repoId => {
//   var repo = reposFromServer[repoId];
//   const checkboxHandler = this.generateCheckboxHandler(repoId);
//   reposDisplayList.push(
//     <li key={repoId}>
//       <CheckboxInput
//         isChecked={repoId in reposManaged || repoId in reposToAdd}
//         isDisabled={repoId in reposManaged}
//         onClick={checkboxHandler}
//         label={repo.name}
//       />
//     </li>
//   );
// });

//     return (
//       <div>
//         <Text size="large">Which repos do you want to add?</Text>
//         <Form onSubmit={this.handleReposSubmit}>
//           <RepoList>{reposDisplayList}</RepoList>
//           <Button mode="strong" type="submit" wide>
//             Finish
//           </Button>
//         </Form>
//       </div>
//     );
//   }
