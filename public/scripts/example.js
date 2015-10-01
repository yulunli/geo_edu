/**
 * This file provided by Facebook is for non-commercial testing and evaluation
 * purposes only. Facebook reserves all rights not expressly granted.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
 * FACEBOOK BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
 * ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

var Model = React.createClass({
  getInitialState: function() {
    return {data: []};
  },
  // Equilibrium model
  setData: function() {
    var minerals = ['olivine', 'clinopyroxene', 'plagioclase', 'magnetite'];
    var elements = ['th',	'nb',	'ce',	'y'];
    var mode = {olivine: 0.21, clinopyroxene: 0.14, plagioclase: 0.63, magnetite: 0.02};
    var iniCon = {th: 0.8,	nb: 3.85,	ce: 11,	y: 15.45}; // C_0, initial concentration
    var targetVal = {th: 7.1,	nb: 30,	ce: 87.2,	y: 72}; // Traget values
    var incPercent = 5; // Fractionation increment, using integer to avoid floating point errors
    var fraction = [];
    for (var i = 0; i <= 100; i += incPercent) {
      fraction.push(i / 100);
    }

    var k_d_values = {
      olivine: {
        th: 0.02,	nb: 0.01,	ce: 0.0065,	y: 0.0100
      },
      clinopyroxene: {
        th: 0.03,	nb: 0.005,	ce: 0.1,	y: 0.9
      },
      plagioclase: {
        th: 0.01,	nb: 0.01,	ce: 0.11,	y: 0.03
      },
      magnetite: {
        th: 0.1,	nb: 0.4,	ce: 1,	y: 0.2
      }
    };

    var bulkD = {}; // Bulk D values
    elements.forEach(function(el) {
      var bulkDVal = 0;
      minerals.forEach(function(val) {
        var mineral = k_d_values[val][el];
        bulkDVal += mineral * mode[val];
      });
      bulkD[el] = bulkDVal;
    });

    var normalizedModeledComposition = {};
    elements.forEach(function(el) {
      var comp = [];
      fraction.forEach(function(val) {
        var a = 1 / (bulkD[el] + val * (1 - bulkD[el]));
        comp.push(a);
      });
      normalizedModeledComposition[el] = comp;
    });

    var modeledComposition = {};
    elements.forEach(function(el) {
      var ini = iniCon[el];
      modeledComposition[el] = normalizedModeledComposition[el].map(function(x) {
        return x * ini;
      });
    });

    var targetValComposition = {};
    elements.forEach(function(el) {
      var target = targetVal[el];
      targetValComposition[el] = modeledComposition[el].map(function(x) {
        return x / target;
      })
    });
    console.log(targetValComposition);

    this.setState({data: [1, 2, 3]});
    var data = function() {
      var sin = [], cos = [];

      for (var i = 0; i < 100; i++) {
        sin.push({x: i, y: Math.sin(i/10)});
        cos.push({x: i, y: .5 * Math.cos(i/10)});
      }

      return [
        {
          values: sin,
          key: 'Sine Wave',
          color: '#ff7f0e'
        },
        {
          values: cos,
          key: 'Cosine Wave',
          color: '#2ca02c'
        }
      ];
    };

    nv.addGraph(function() {
      var chart = nv.models.lineChart().useInteractiveGuideline(true);
      chart.xAxis.axisLabel('Time (ms)').tickFormat(d3.format(',r'));
      chart.yAxis.axisLabel('Voltage (v)').tickFormat(d3.format('.02f'));
      d3.select('#chart svg').datum(data()).transition().duration(500).call(chart);
      nv.utils.windowResize(chart.update);
      return chart;
    });

  },

  componentDidMount: function() {
    this.setData();
  },

  render: function() {
    return (
      <h1>Works! {this.state.data}</h1>
    )
  }
});

var Comment = React.createClass({
  render: function() {
    var rawMarkup = marked(this.props.children.toString(), {sanitize: true});
    return (
      <div>
        <h2>
          {this.props.author}
        </h2>
        <span dangerouslySetInnerHTML={{__html: rawMarkup}} />
      </div>
    );
  }
});

var CommentBox = React.createClass({
  loadCommentsFromServer: function() {
    $.ajax({
      url: this.props.url,
      dataType: 'json',
      cache: false,
      success: function(data) {
        this.setState({data: data});
      }.bind(this),
      error: function(xhr, status, err) {
        console.error(this.props.url, status, err.toString());
      }.bind(this)
    });
  },
  handleCommentSubmit: function(comment) {
    var comments = this.state.data;
    var newComments = comments.concat([comment]);
    this.setState({data: newComments});
    $.ajax({
      url: this.props.url,
      dataType: 'json',
      type: 'POST',
      data: comment,
      success: function(data) {
        this.setState({data: data});
      }.bind(this),
      error: function(xhr, status, err) {
        console.error(this.props.url, status, err.toString());
      }.bind(this)
    });
  },
  getInitialState: function() {
    return {data: []};
  },
  componentDidMount: function() {
    this.loadCommentsFromServer();
    setInterval(this.loadCommentsFromServer, this.props.pollInterval);
  },
  render: function() {
    return (
      <div className="commentBox">
        <h1>Comments</h1>
        <CommentList data={this.state.data} />
        <CommentForm onCommentSubmit={this.handleCommentSubmit} />
      </div>
    );
  }
});

var CommentList = React.createClass({
  render: function() {
    var commentNodes = this.props.data.map(function(comment, index) {
      return (
        // `key` is a React-specific concept and is not mandatory for the
        // purpose of this tutorial. if you're curious, see more here:
        // http://facebook.github.io/react/docs/multiple-components.html#dynamic-children
        <Comment author={comment.author} key={index}>
          {comment.text}
        </Comment>
      );
    });
    return (
      <div className="commentList">
        {commentNodes}
      </div>
    );
  }
});

var CommentForm = React.createClass({
  handleSubmit: function(e) {
    e.preventDefault();
    var author = React.findDOMNode(this.refs.author).value.trim();
    var text = React.findDOMNode(this.refs.text).value.trim();
    if (!text || !author) {
      return;
    }
    this.props.onCommentSubmit({author: author, text: text});
    React.findDOMNode(this.refs.author).value = '';
    React.findDOMNode(this.refs.text).value = '';
  },
  render: function() {
    return (
      <form className="commentForm" onSubmit={this.handleSubmit}>
        <input type="text" placeholder="Your name" ref="author" />
        <input type="text" placeholder="Say something..." ref="text" />
        <input type="submit" value="Post" />
      </form>
    );
  }
});

//React.render(
//  <CommentBox url="comments.json" pollInterval={2000} />,
//  document.getElementById('content')
//);

React.render(
  <Model />,
  document.getElementById('model')
);
