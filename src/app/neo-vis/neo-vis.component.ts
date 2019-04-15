import {Component, Input, OnInit} from '@angular/core';

import * as vis from 'vis';
import * as neo4j from 'neo4j-driver';
import {Driver} from 'neo4j-driver/types/v1';

@Component({
  selector: 'app-neo-vis',
  templateUrl: './neo-vis.component.html',
  styleUrls: ['./neo-vis.component.scss']
})

export class NeoVisComponent implements OnInit {

  @Input() cypherQuery: string;

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

  /**
   *TODO:dawny konstructor
   *
   * constructor
   */
  setup(config) {
    console.log(config);
    // console.log(this.defaults);

    this._config    = config;
    this._encrypted = config.encrypted;
    this._trust     = config.trust;
    this._query     = config.cypher_query;
    this._nodes     = {};
    this._edges     = {};
    this._data      = {};
    this._network   = null;

    this._container = document.getElementById(config.container_id);
    this._driver    = neo4j.v1.driver(config.server_url, neo4j.v1.auth.basic(config.server_user, config.server_password), {
      encrypted: this._encrypted,
      trust: this._trust
      });
  }

  // wywalilem config_container bo i tak go narazie nie uzywalismy - pozniej mozemy dodac spowrotem
  ngOnInit() {
    console.log('init');
    this.setup(this.getConfig('container_vis_0', this.cypherQuery));
    this.render();
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

    const self = this;
    const node = {};
    const label = n.labels[0];

    const captionKey = this._config && this._config.labels && this._config.labels[label] && this._config.labels[label]['caption'],
        sizeKey = this._config && this._config.labels && this._config.labels[label] && this._config.labels[label]['size'],
        // sizeCorrection = this._config && this._config.labels && this._config.labels[label] && this._config.labels[label]['sizeCorrection'],
        sizeCypher = this._config && this._config.labels && this._config.labels[label] && this._config.labels[label]['sizeCypher'],
        communityKey = this._config && this._config.labels && this._config.labels[label] && this._config.labels[label]['community'];

    node['id'] = n.identity.toInt();

    // node size

    if (sizeCypher) {
      // use a cypher statement to determine the size of the node
      // the cypher statement will be passed a parameter {id} with the value
      // of the internal node id

      const session = this._driver.session();
      session.run(sizeCypher, {id: neo4j.v1.int(node['id'])})
        .then(function (result) {
          result.records.forEach(function (record) {
            record.forEach(function (v) {
              if (typeof v === 'number') {
                  self._addNode({id: node['id'], value: v});
              } else if (v.constructor.name === 'Integer') {
                  self._addNode({id: node['id'], value: v.toNumber()});
              }
            });
          });
        });


    } else if (typeof sizeKey === 'number') {
        node['value'] = sizeKey;
    } else {

      const sizeProp = n.properties[sizeKey];

      if (sizeProp && typeof sizeProp === 'number') {
        // propety value is a number, OK to use
        node['value'] = sizeProp;
      } else if (sizeProp && typeof sizeProp === 'object' && sizeProp.constructor.name === 'Integer') {
        // property value might be a Neo4j Integer, check if we can call toNumber on it:
        if (sizeProp.inSafeRange()) {
          node['value'] = sizeProp.toNumber();
        } else {
          // couldn't convert to Number, use default
          node['value'] = 1.0;
        }
      } else {
        node['value'] = 1.0;
      }
    }

    // node caption
    node['label'] = n.properties[captionKey] || label || '';
    // TODO:zmienic domyslna wartosc/ TC tu mozna pomyslec co robic z png
    node['image'] = n.properties.image || 'https://mbtskoudsalg.com/explore/no-image-png/#gal_post_3930_no-image-png-1.png' || '';

    // community
    // behavior: color by value of community property (if set in config), then color by label
    if (!communityKey) {
      node['group'] = label;
    } else {
      try {
        if (n.properties[communityKey]) {
          // node['group'] = n.properties[communityKey].toNumber() || label || 0;
          // nie wiem co tu sie wyprawia jeszcze.
          node['group'] = n.properties[communityKey] || label || 0;
        } else {
          node['group'] = 0;
        }
      } catch (e) {
        node['group'] = 0;
      }
    }
    // set all properties as tooltip
    node['title'] = '';
    for (const key in n.properties) {
      // bardziej poprawna forma - nie mam jeszcze pewnosci czy nie psuje czegos
      // https://stackoverflow.com/questions/40770425/tslint-codelyzer-ng-lint-error-for-in-statements-must-be-filtere
      if (n.hasOwnProperty(key)) {
        node['title'] += '<strong>' + key + ':</strong>' + ' ' + n.properties[key] + '<br>';
      }
    }
    return node;
  }

  /**
   * Build edge object for vis from a neo4j Relationship
   */
  buildEdgeVisObject(r) {

    const weightKey  = this._config && this._config.relationships && this._config.relationships[r.type] && this._config.relationships[r.type]['thickness'],
          captionKey = this._config && this._config.relationships && this._config.relationships[r.type] && this._config.relationships[r.type]['caption'];

    const edge = {};
    edge['id']   = r.identity.toInt();
    edge['from'] = r.start.toInt();
    edge['to']   = r.end.toInt();

    // hover tooltip. show all properties in the format <strong>key:</strong> value
    edge['title'] = '';
    for (const key in r.properties) {
      if (r.hasOwnProperty(key)) {
        edge['title'] += '<strong>' + key + ':</strong>' + ' ' + r.properties[key] + '<br>';
      }
    }
    // set relationship thickness
    if (weightKey && typeof weightKey === 'string') {
      edge['value'] = r.properties[weightKey];
    } else if (weightKey && typeof weightKey === 'number') {
      edge['value'] = weightKey;
    } else {
      edge['value'] = 1.0;
    }

    // set caption
    if (typeof captionKey === 'boolean') {
      if (!captionKey) {
        edge['label'] = '';
      } else {
        edge['label'] = r.type;
      }
    } else if (captionKey && typeof captionKey === 'string') {
      edge['label'] = r.properties[captionKey] || '';
    } else {
      edge['label'] = r.type;
    }

    return edge;
  }

  // public API

  handleNode(value) {
    const self = this;
    const node = self.buildNodeVisObject(value);

    try {
      self._addNode(node);
    } catch (e) {
      console.log(e);
    }
  }

  handlePath(value) {
    const self = this;
    const n1 = self.buildNodeVisObject(value.start);
    const n2 = self.buildNodeVisObject(value.end);

    self._addNode(n1);
    self._addNode(n2);

    value.segments.forEach((obj) => {

      self._addNode(self.buildNodeVisObject(obj.start));
      self._addNode(self.buildNodeVisObject(obj.end));
      self._addEdge(self.buildEdgeVisObject(obj.relationship));
    });
  }

  handleRelationship(value) {
    const self = this;
    const edge = self.buildEdgeVisObject(value);

    try {
      self._addEdge(edge);
    } catch (e) {
      console.log(e);
    }
  }

  handleArray(value) {
    const self = this;
    value.forEach(function(obj) {
      if (obj.constructor.name === 'Node') {
        const node = self.buildNodeVisObject(obj);

        try {
          self._addNode(node);
        } catch (e) {
          console.log(e);
        }
      } else if (obj.constructor.name === 'Relationship') {
        const edge = self.buildEdgeVisObject(obj);

        try {
          self._addEdge(edge);
        } catch (e) {
          console.log(e);
        }
      }
    });
  }

  handleOnNext(record) {
    const self = this;
    record.forEach(function(v) { // (v, k ,r)
      if      (v.constructor.name === 'Node') {self.handleNode(v); }
      else if (v.constructor.name === 'Relationship') {self.handleRelationship(v); }
      else if (v.constructor.name === 'Path')         {self.handlePath(v); }
      else if (v.constructor.name === 'Array')        {self.handleArray(v); }
    });
  }

  handleOnCompleted() {
    const self    = this;
    const session = this._driver.session();

    session.close();
    self.createVisGraph(self._nodes, self._edges);
    setTimeout(() => { self._network.stopSimulation(); }, 10000);
  }

  handleOnError(error) {
    console.log(error);
  }

  render() {
    const self    = this;
    const session = this._driver.session();
    session.run(this._query, {limit: 30})
      .subscribe({
        onNext      : function (record) { self.handleOnNext(record); },
        onCompleted : function ()       { self.handleOnCompleted(); },
        onError     : function (error)  { self.handleOnError (error); },
      });
    return session;
  }

  createVisGraph(nodes, edges) {
    const self = this;
    self._data = {
      'nodes': new vis.DataSet(Object.values(nodes)),
      'edges': new vis.DataSet(Object.values(edges))
    };

    const container = self._container;
    const options   = self.getOptions();
    self._network = new vis.Network(container, self._data, options);
  }


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
   */
  reinit(config) {
  }

  /**
   * Fetch live data form the server and reload the visualization
   */
  reload() {
    this.clearNetwork();
    this.render();
  }

  /**
   * Stabilize the visuzliation
   */
  stabilize() {
    this._network.stopSimulation();
    console.log('Calling stopSimulation');
  }

  /**
   * Execute an arbitrary Cypher query and re-renderNeoVis the visualization
   */
  renderWithCypher(query) {
    this.clearNetwork();
    this._query = query;
    this.render();
  }

  clOnCompleted() {
  }

  getOptions() {
    return {
      nodes: {
        shape: 'dot',
        font: {
          size: 26,
          strokeWidth: 7
        },
        scaling: {
          label: {
            enabled: true
          }
        }
      },
      edges: {
        length: 200
      },
      layout: {
        improvedLayout: false,
      },
      physics: { // TODO: adaptive physics settings based on size of graph rendered
        // enabled: true,
        // timestep: 0.5,
        // stabilization: {
        //     iterations: 10
        // }

        adaptiveTimestep: true,
        // barnesHut: {
        //     gravitationalConstant: -8000,
        //     springConstant: 0.04,
        //     springLength: 95
        // },
        stabilization: {
          iterations: 200,
          fit: true
        }

      },

      configure: {
        enabled: false,
        filter: function (option, path) {
          if (path.indexOf('physics') !== -1) {
            return true;
          }
          return true;
        },
        //container: configuration_container
      }
    };
  }

  getConfig(id_vis_container, cypherQ) {
    // const configuration_container = document.getElementById(id_config_container);

    const neo4jConf = {
      server_url: 'bolt://localhost:7687',
      server_password: '123',
      server_user: 'neo4j',
      encrypted: 'ENCRYPTION_OFF',
      trust: 'TRUST_ALL_CERTIFICATES',
      container_id: id_vis_container
    };

    const lables = {
      labels: {
        Bean: {
          caption: 'beanName',
          size: 50, // TODO:
          // sizeCorrection: 50,
          // community: "position"
          // "sizeCypher": "MATCH (n) WHERE id(n) = {id} MATCH (n)-[r]-() RETURN sum(r.weight) AS c"
        },
        Person: {
          caption: 'name'
        },
        Movie: {
          caption: 'title'
        }
      }
    };

    const relationships =  {
      relationships: {
        DEPENDS_ON: {
          thickness: 'weight', // TODO:
          caption: false
        }
      }
    };

    const cypQuery = {
      cypher_query: cypherQ
    };

    return Object.assign({}, neo4jConf, lables, relationships, cypQuery);
  }
}
