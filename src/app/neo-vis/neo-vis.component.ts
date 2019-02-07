import {Component, Input, OnInit, ViewChild, ViewContainerRef} from '@angular/core';

import * as vis from 'vis';
import * as neo4j from 'neo4j-driver';
import {Driver} from "neo4j-driver/types/v1";

@Component({
  selector: 'app-neo-vis',
  templateUrl: './neo-vis.component.html',
  styleUrls: ['./neo-vis.component.scss']
})

export class NeoVisComponent implements OnInit {

  //@Input() cypherQuery: string = "match p = ((n)-[]->()) return p limit 10";

  private _config: any;

  private _encrypted: boolean | any | string | MediaEncryptedEvent;
  private _trust: any | string;

  private _container: HTMLElement;
  private _driver: Driver;

  private _query: string;
  private _nodes: {};
  private _edges: {};
  private _data: {};

  private _network;
  private _nodesData;
  private _edgesData;

  /**
   *TODO:dawny konstructor
   *
   * @constructor
   */
  setup(config) {
    console.log(config);
    //console.log(this.defaults);

    this._config = config;
    this._encrypted = config.encrypted || this.defaults['neo4j']['encrypted'];
    this._trust = config.trust || this.defaults.neo4j.trust;
    this._driver = neo4j.v1.driver(config.server_url || this.defaults.neo4j.neo4jUri, neo4j.v1.auth.basic(config.server_user || this.defaults.neo4j.neo4jUser, config.server_password || this.defaults.neo4j.neo4jPassword), {
      encrypted: this._encrypted,
      trust: this._trust
    });
    this._query = config.initial_cypher || this.defaults.neo4j.initialQuery;
    this._nodes = {};
    this._edges = {};
    this._data = {};
    this._network = null;

    this._nodesData = null;
    this._edgesData = null;

    this._container = document.getElementById(config.container_id);

  }

  _addNode(node) {
    this._nodes[node.id] = node;
  }

  _addEdge(edge) {
    this._edges[edge.id] = edge;
  }

  /**
   * Build node object for vis from a neo4j Node
   * FIXME: use config
   * FIXME: move to private api
   * @param n
   * @returns {{}}
   */
  buildNodeVisObject(n) {

    var self = this;
    let node = {};
    let label = n.labels[0];

    let captionKey = this._config && this._config.labels && this._config.labels[label] && this._config.labels[label]['caption'],
      sizeKey = this._config && this._config.labels && this._config.labels[label] && this._config.labels[label]['size'],
      sizeCorrection = this._config && this._config.labels && this._config.labels[label] && this._config.labels[label]['sizeCorrection'],
      sizeCypher = this._config && this._config.labels && this._config.labels[label] && this._config.labels[label]['sizeCypher'],
      communityKey = this._config && this._config.labels && this._config.labels[label] && this._config.labels[label]['community'];

    node['id'] = n.identity.toInt();

    // node size

    if (sizeCypher) {
      // use a cypher statement to determine the size of the node
      // the cypher statement will be passed a parameter {id} with the value
      // of the internal node id

      let session = this._driver.session();
      session.run(sizeCypher, {id: neo4j.v1.int(node['id'])})
        .then(function (result) {
          result.records.forEach(function (record) {
            record.forEach(function (v) { //record.forEach(function (v, k, r) {
              if (typeof v === "number") {
                self._addNode({id: node['id'], value: v});
              } else if (v.constructor.name === "Integer") {
                self._addNode({id: node['id'], value: v.toNumber()})
              }
            })
          })
        })


    } else if (typeof sizeKey === "number") {
      node['value'] = sizeKey;
    } else {

      let sizeProp = n.properties[sizeKey];

      if (sizeProp && typeof sizeProp === "number") {
        // propety value is a number, OK to use
        if (typeof sizeCorrection === "number") {
          node['value'] = sizeProp / sizeCorrection;
        } else {
          node['value'] = sizeProp;
        }
      } else if (sizeProp && typeof sizeProp === "object" && sizeProp.constructor.name === "Integer") {
        // property value might be a Neo4j Integer, check if we can call toNumber on it:
        if (sizeProp.inSafeRange()) {
          if (typeof sizeCorrection === "number") {
            node['value'] = sizeProp.toNumber() / sizeCorrection;
          } else {
            node['value'] = sizeProp.toNumber();
          }
        } else {
          // couldn't convert to Number, use default
          node['value'] = 1.0;
        }
      } else {
        node['value'] = 1.0;
      }
    }

    // node caption
    node['label'] = n.properties[captionKey] || label || "";
    //TODO:zmienic domyslna wartosc
    node['image'] = n.properties.image || 'https://mbtskoudsalg.com/explore/no-image-png/#gal_post_3930_no-image-png-1.png' || "";

    // community
    // behavior: color by value of community property (if set in config), then color by label
    if (!communityKey) {
      node['group'] = label;
    } else {
      try {
        if (n.properties[communityKey]) {
          node['group'] = n.properties[communityKey] || label || 0;

        } else {
          node['group'] = 0;
        }

      } catch (e) {
        node['group'] = 0;
      }


    }


    // set all properties as tooltip
    node['title'] = "";
    for (let key in n.properties) {
      node['title'] += "<strong>" + key + ":</strong>" + " " + n.properties[key] + "<br>";
    }
    return node;
  }

  /**
   * Build edge object for vis from a neo4j Relationship
   * @param r
   * @returns {{}}
   */
  buildEdgeVisObject(r) {

    let weightKey = this._config && this._config.relationships && this._config.relationships[r.type] && this._config.relationships[r.type]['thickness'],
      captionKey = this._config && this._config.relationships && this._config.relationships[r.type] && this._config.relationships[r.type]['caption'];

    let edge = {};
    edge['id'] = r.identity.toInt();
    edge['from'] = r.start.toInt();
    edge['to'] = r.end.toInt();

    // hover tooltip. show all properties in the format <strong>key:</strong> value
    edge['title'] = "";
    for (let key in r.properties) {
      edge['title'] += "<strong>" + key + ":</strong>" + " " + r.properties[key] + "<br>";
    }

    // set relationship thickness
    if (weightKey && typeof weightKey === "string") {
      edge['value'] = r.properties[weightKey];
    } else if (weightKey && typeof weightKey === "number") {
      edge['value'] = weightKey;
    } else {
      edge['value'] = 1.0;
    }

    // set caption


    if (typeof captionKey === "boolean") {
      if (!captionKey) {
        edge['label'] = "";
      } else {
        edge['label'] = r.type;
      }
    } else if (captionKey && typeof captionKey === "string") {
      edge['label'] = r.properties[captionKey] || "";
    } else {
      edge['label'] = r.type;
    }

    return edge;
  }

  // public API

  renderNeoVis() {
    let self = this;

    let session = this._driver.session();
    session
      .run(this._query, {limit: 30})
      .subscribe({
        onNext: function (record) {
          console.log("CLASS NAME");
          console.log(record.constructor.name);
          console.log(record);

          record.forEach(function (v) { // record.forEach(function (v, k, r) {
            console.log("Constructor:");
            console.log(v.constructor.name);
            if (v.constructor.name === "Node") {
              let node = self.buildNodeVisObject(v);

              try {
                self._addNode(node);
              } catch (e) {
                console.log(e);
              }

            } else if (v.constructor.name === "Relationship") {

              let edge = self.buildEdgeVisObject(v);

              try {
                self._addEdge(edge);
              } catch (e) {
                console.log(e);
              }

            } else if (v.constructor.name === "Path") {
              console.log("PATH");
              console.log(v);
              let n1 = self.buildNodeVisObject(v.start);
              let n2 = self.buildNodeVisObject(v.end);

              self._addNode(n1);
              self._addNode(n2);

              v.segments.forEach((obj) => {

                self._addNode(self.buildNodeVisObject(obj.start));
                self._addNode(self.buildNodeVisObject(obj.end));
                self._addEdge(self.buildEdgeVisObject(obj.relationship))
              });

            } else if (v.constructor.name === "Array") {
              v.forEach(function (obj) {
                console.log("Array element constructor:");
                console.log(obj.constructor.name);
                if (obj.constructor.name === "Node") {
                  let node = self.buildNodeVisObject(obj);

                  try {
                    self._addNode(node);
                  } catch (e) {
                    console.log(e);
                  }
                } else if (obj.constructor.name === "Relationship") {
                  let edge = self.buildEdgeVisObject(obj);

                  try {
                    self._addEdge(edge);
                  } catch (e) {
                    console.log(e);
                  }
                }
              });
            }

          })
        },
        onCompleted: function () {
          session.close();

          let append_options = {
            layout: {
              improvedLayout: false,
              hierarchical: {
                enabled: self._config.hierarchical || false,
                sortMethod: self._config.hierarchical_sort_method || "hubsize"

              }
            }
          };

          let options = Object.assign({}, self._config && self._config.options, append_options);

          let container = self._container;
          self._nodesData = new vis.DataSet(Object.values(self._nodes));
          self._edgesData = new vis.DataSet(Object.values(self._edges));

          self._data = {
            "nodes": self._nodesData,
            "edges": self._edgesData
          };

          //console.log(self._data.nodes);
          //console.log(self._data.edges);

          // Create duplicate node for any self reference relationships
          // NOTE: Is this only useful for data model type data
          // self._data.edges = self._data.edges.map(
          //     function (item) {
          //          if (item.from == item.to) {
          //             var newNode = self._data.nodes.get(item.from)
          //             delete newNode.id;
          //             var newNodeIds = self._data.nodes.add(newNode);
          //             console.log("Adding new node and changing self-ref to node: " + item.to);
          //             item.to = newNodeIds[0];
          //          }
          //          return item;
          //     }
          // );

          self._network = new vis.Network(container, self._data, options);

          console.log("completed");
          self.clOnCompleted();
          setTimeout(() => {
            self._network.stopSimulation();

          }, 10000);

        },
        onError: function (error) {
          console.log(error);
        }

      })
  };

  /**
   * Clear the data for the visualization
   */
  clearNetwork() {
    this._nodes = {};
    this._edges = {};
    this._network.setData([]);
  }


  /**
   * Reset the config object and reload data
   * @param config
   */
  reinit(config) {
  };

  /**
   * Fetch live data form the server and reload the visualization
   */
  reload() {
    this.clearNetwork();
    this.renderNeoVis();
  };

  /**
   * Stabilize the visuzliation
   */
  stabilize() {
    this._network.stopSimulation();
    console.log("Calling stopSimulation");
  }

  /**
   * Execute an arbitrary Cypher query and re-renderNeoVis the visualization
   * @param query
   */
  renderWithCypher(query) {
    this.clearNetwork();
    this._query = query;
    this.renderNeoVis();

  };

  clOnCompleted() {
  }

  ngOnInit() {
    this.setup(this.getConfig("container_vis_0", "container_config_0" ,"match p = ((n)-[]->()) return p limit 10"));
    this.renderNeoVis();
  }

  getConfig(id_vis_container, id_config_container, cypherQ) {
    let configuration_container = document.getElementById(id_config_container);

    let neo4jConf = {
      "server_url": "bolt://localhost:11001",
      "server_password": "123",
      "server_user": "neo4j"
    };
    neo4jConf["container_id"]  = id_vis_container;

    let options = {};

    options["options"] = {
      nodes: {
        shape: 'dot',
        font: {
          "color": "rgba(0,0,0,1)",
          "size": 10,
          "face": "tahoma",
          "background": "rgba(44,23,48,0)",
          "strokeColor": "rgba(33,46,255,1)"
        },
        scaling: {
          label: {
            enabled: true
          }
        }
      },
      edges: {
        "arrows": {
          "middle": {
            "enabled": true,
            "scaleFactor": 1
          }
        },
        "color": {
          "color": "#009DDE",
          "highlight": "#002864",
          "hover": "#009DDE",
          "inherit": false
        },
        "selectionWidth": 3,
        "font": {
          "size": 45
        },
        "hoverWidth": 4,
        "smooth": {
          "forceDirection": "vertical",
          "roundness": 0.15
        },
        "width": 3
      },
      groups: {
        diamonds: {
          color: {background: 'red', border: 'white'},
          shape: 'diamond'
        },
        dotsWithLabel: {
          label: "I'm a dot!",
          shape: 'dot',
          color: 'cyan'
        },
        Team: {
          shape: 'circularImage',
          color: "rgba(150,150,150,1)",
          size: 50,
          "font": {
            "color": "rgba(30,30,30,1)",
            "size": 16,
            "face": "tahoma",
            "background": "rgba(44,23,48,0)",
            "strokeColor": "rgba(33,46,255,1)"
          },
          scaling: {
            min: 0,
            max: 100
          }
        },
        Player: {
          shape: 'image',
          scaling: {
            min: 30,
            max: 100
          }
        },

        Bean: {
          shape: 'image',
          size: 50,
          icon: {
            face: 'FontAwesome',
            code: '\uf573',
            size: 100,  //50,
            color:'#009DDE'
          },
          shadow: {
            "enabled": true,
            "color": "rgba(30,30,30,0.5)",
          },
          "font": {
            "size": 12,
            "color": "#001C54",
            "face": "tahoma",
            "strokeColor": "#000000",
            "strokeWidth": 0.25,
            "vadjust": 2
          }
        },

        "POINT GUARD": {
          shape: 'circularImage',
          font: {
            "color": "rgba(130,130,130,1)",
            "size": 16,
            "face": "tahoma",
            "background": "rgba(44,23,48,0)",
            "strokeColor": "rgba(33,46,255,1)"
          },
          scaling: {
            min: 30,
            max: 100
          }
        },
        "POWER FORWARD": {
          shape: 'image',

          scaling: {
            min: 30,
            max: 100
          }

        },
        "SMALL FORWARD": {
          shape: 'image',

          scaling: {
            min: 30,
            max: 100
          }

        },
        "CENTER": {
          shape: 'circularImage',
          color: "rgba(255,20,150,1)",
          "font": {
            "color": "rgba(130,130,130,1)",
            "size": 25,
            "bold" : true,
            "face": "tahoma",
            "background": "rgba(44,23,48,0)",
            "strokeColor": "rgba(33,46,255,1)"
          },
          scaling: {
            min: 30,
            max: 100
          }

        },
        "SHOOTING GUARD": {
          shape: 'image',

          scaling: {
            min: 30,
            max: 100 //TODO:
          }

        }
      },
      "physics": {
        "barnesHut": {
          "gravitationalConstant": -23750,
          "centralGravity": 1.65,
          "springLength": 285
        },
        "minVelocity": 0.75
      },
      "interaction": {
        "hover": true,
        // "keyboard": {
        //     "enabled": true
        // },
        "multiselect": true,
        "navigationButtons": false,
        "tooltipDelay": 2675
      },
      "manipulation": {
        "enabled": false,
        "initiallyActive": false
      }
    };
    options["options"]["configure"] =
      {
        enabled: false,
        filter: function (option, path) {
          if (path.indexOf('physics') !== -1) {
            return true;
          }
          return true;
        },
        container: configuration_container
      };

    let lables = {
      labels: {
        Team: {
          caption: "name",
          //community: "position"//TODO:
          //"sizeCypher": "MATCH (n) WHERE id(n) = {id} RETURN (SIZE((n)--()) * 1.0)/30 AS v "

        },
        Player: {
          caption: "name",
          size: "age",//TODO:
          sizeCorrection: 50,
          community: "position"
          //"sizeCypher": "MATCH (n) WHERE id(n) = {id} MATCH (n)-[r]-() RETURN sum(r.weight) AS c"
        },
        Bean: {
          caption: "beanName",
          size: 50,//TODO:
          //sizeCorrection: 50,
          //community: "position"
          //"sizeCypher": "MATCH (n) WHERE id(n) = {id} MATCH (n)-[r]-() RETURN sum(r.weight) AS c"
        }
      }
    };

    let relationships=  {
      relationships: {
        PLAYED: {
          thickness: "weight",//TODO:
          caption: false
        },
        DEPENDS_ON: {
          thickness: "weight",//TODO:
          caption: false
        }
      }
    };
    let cypQuery = {
      initial_cypher: cypherQ
    };
    return Object.assign({}, neo4jConf, options, lables, relationships, cypQuery);
  }

  private defaults = {

    neo4j: {
      initialQuery: `MATCH (n:Bean) RETURN n LIMIT 25;`,
      neo4jUri: "bolt://localhost:7687",
      neo4jUser: "neo4j",
      neo4jPassword: "123",
      encrypted: "ENCRYPTION_OFF",
      trust: "TRUST_ALL_CERTIFICATES"
    },

    visjs: {
      interaction: {
        hover: true,
        hoverConnectedEdges: true,
        selectConnectedEdges: false,
        //        multiselect: true,
        multiselect: 'alwaysOn',
        zoomView: false,
        experimental: {}
      },
      physics: {
        barnesHut: {
          damping: 0.1
        }
      },
      nodes: {
        mass: 4,
        shape: 'neo',
        labelHighlightBold: false,
        widthConstraint: {
          maximum: 40
        },
        heightConstraint: {
          maximum: 40
        }
      },
      edges: {
        hoverWidth: 0,
        selectionWidth: 0,
        smooth: {
          type: 'continuous',
          roundness: 0.15
        },
        font: {
          size: 9,
          strokeWidth: 0,
          align: 'top'
        },
        color: {
          inherit: false
        },
        arrows: {
          to: {
            enabled: true,
            type: 'arrow',
            scaleFactor: 0.5
          }
        }
      }

    }
  };
}
