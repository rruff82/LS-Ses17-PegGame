import logo from './logo.svg';
import './App.css';
import React, { useState, useEffect } from 'react';

const BOARD_SIZE = 7
const CORNER_SIZE = 2;

const NUM_PEGS = BOARD_SIZE*BOARD_SIZE-4*CORNER_SIZE*CORNER_SIZE;
const CENTER_PEG = ((NUM_PEGS-1)/2);

function MakeRange(n) {
  return Array.from(Array(n).keys())
}
function SumOfArray(v) {
  return v.reduce((a,b) => a+b, 0);
}

const INITIAL_STATE = MakeRange(NUM_PEGS).map((x) => (x!=CENTER_PEG));


const SIZE_OF_ROW = MakeRange(BOARD_SIZE).map(
    (i) => (
      (i < CORNER_SIZE || i >= BOARD_SIZE-CORNER_SIZE) ?
      (BOARD_SIZE-2*CORNER_SIZE) : BOARD_SIZE
  ));
const ROW_MARKERS = MakeRange(BOARD_SIZE-1).map(
  (x) => (
    x == 0 ? SIZE_OF_ROW[x] :
    SumOfArray(MakeRange(x+1).map((y) => SIZE_OF_ROW[y]))
  )
)
console.log(ROW_MARKERS)

const PEG_TO_ROW = MakeRange(NUM_PEGS).map(
  (x) => (
    ROW_MARKERS.filter((y) => (y <= x)).length
  )
)

const PEG_TO_COL = MakeRange(NUM_PEGS).map(
  (x) => (x < BOARD_SIZE-2*CORNER_SIZE ? x+CORNER_SIZE
  : (x-ROW_MARKERS[PEG_TO_ROW[x]-1]
    +(BOARD_SIZE-SIZE_OF_ROW[PEG_TO_ROW[x]])/2)
  )
)


const PEG_COORDINATES = MakeRange(NUM_PEGS).map((x) => (
  [PEG_TO_COL[x],PEG_TO_ROW[x]]
))

function ValidCoordinates(p) {
  if (p[0] < 0 || p[0] >= BOARD_SIZE || p[1] < 0 || p[1] >= BOARD_SIZE) {
    return false;
  }
  if ((p[0] < CORNER_SIZE || p[0] >= BOARD_SIZE - CORNER_SIZE) &&
    (p[1] < CORNER_SIZE || p[1] >= BOARD_SIZE - CORNER_SIZE)) {
      return false;
  }
  return true;
}

function PegListByCoords(p) {
  if (!ValidCoordinates(p)) {
    return []
  } else {
    if (p[1] < CORNER_SIZE) {
      // first block of rows
      return [p[1]*(BOARD_SIZE-2*CORNER_SIZE)+p[0]-CORNER_SIZE];
    } else if (p[1] >= BOARD_SIZE-CORNER_SIZE) {
      // last block of rows
      return [NUM_PEGS - (BOARD_SIZE-p[1])*(BOARD_SIZE-2*CORNER_SIZE)-CORNER_SIZE+p[0]];
    } else {
      // center block
      return [p[0]+ROW_MARKERS[p[1]-1]]
    }
  }
}

const PEG_LIST_TABLE = MakeRange(BOARD_SIZE*BOARD_SIZE).map(
  (i) => PegListByCoords([i%BOARD_SIZE,(i-(i%BOARD_SIZE))/BOARD_SIZE])
)
console.log(PEG_LIST_TABLE)

function SplitGameState(s) {
    return [
      MakeRange(NUM_PEGS).filter( (x) => s[x]),
      MakeRange(NUM_PEGS).filter( (x) => !s[x])
    ]
}

function FormPairs(a,b) {
  return MakeRange(a.length*b.length).map(
    (i) => [a[i%a.length],b[(i-(i%a.length))/a.length]]
  )
}

function TwoStepsAway(jumpPair) {
  if (jumpPair[0][0]==jumpPair[1][0]) {
    if (jumpPair[0][1]==jumpPair[1][1]+2) {
      return true;
    }
    if (jumpPair[0][1]==jumpPair[1][1]-2) {
      return true
    }
  }
  if (jumpPair[0][1]==jumpPair[1][1]) {
    if (jumpPair[0][0]==jumpPair[1][0]+2) {
      return true;
    }
    if (jumpPair[0][0]==jumpPair[1][0]-2) {
      return true;
    }
  }
  return false;
}

function JumpCenter(peg1,peg2) {
  const p1 = PEG_COORDINATES[peg1];
  const p2 = PEG_COORDINATES[peg2];
  const p3 = [(p1[0]+p2[0])/2,(p1[1]+p2[1])/2];
  return PEG_LIST_TABLE[p3[0] + p3[1]*BOARD_SIZE][0]
}

function ValidMoves(state) {
  console.log("evaluating moves from state:"+state)
  const splitState = SplitGameState(state);
  console.log("splitting state:");
  console.log(splitState);

  console.log("forming pairs");
  const possiblePairs = FormPairs(splitState[0],splitState[1]);
  console.log(possiblePairs)

  console.log("validiating jumps")
  const validJumps = possiblePairs.filter(
      (x) => TwoStepsAway([
          PEG_COORDINATES[x[0]],
          PEG_COORDINATES[x[1]]
        ])
    );
  console.log(validJumps)
  const jumpTriples = validJumps.map(
    (x) => [
      x[0],
      x[1],
      JumpCenter(x[0],x[1])
    ]
  )
  console.log(jumpTriples)
  return jumpTriples.filter(
    (x) => state[x[2]]
  )

}


const Peg = (props) => {
  console.log("rendering peg: ")
  console.log(props)
  const filled = (props.state[props.index]);
  const source_of_move = props.moves.filter((x) => (x[0] == props.index));
  const target_of_move = props.moves.filter((x) => (x[1] == props.index));
  const jumped_by_move = props.moves.filter((x) => (x[2] == props.index));
  const selectionCallback = ((e) => (
      props.controller([props.index,-1,-1])));
  const targetCallback = ((e) => (
      props.controller([props.selections[0],props.index,-1])));
  const confirmationCallback = ((e) => (
      props.controller([props.selections[0],props.selections[1],props.index])));
  const display_char = (filled ? "●" : "○");
  if (props.selections[0] < 0) {
    // no source peg selected
    // are we a potential one?
    if (source_of_move.length) {
          console.log("a move can be started from " + props.index)
          return (<button onClick={selectionCallback}>
            {display_char}
            </button>)
    }
  } else if (props.selections[1] < 0) {
    // no target selected, are we one?
    const filteredTargets = target_of_move.filter(
      (x) => (x[0] == props.selections[0])
    );
    if (filteredTargets.length) {
          console.log("a move can target " + props.index)
          return (<button onClick={targetCallback}>{display_char}</button>)
    }
  } else if (props.selections[2] < 0) {
    // no confirmation selected, are we one?
    const filteredConfirmations = jumped_by_move.filter(
      (x) => (x[0] == props.selections[0] && x[1] == props.selections[1])
    )
    if (filteredConfirmations.length) {
          console.log("a move can jump over " + props.index)
          return (<button onClick={confirmationCallback}>{display_char}</button>)
    }
  }


  return (<span>{display_char}</span>)
}

const BoardCell = (props) => {
  //console.log(props)
      return (<td>
        {
          PegListByCoords([props.col,props.row]).map( (x) =>
        (<Peg key={"peg"+x}
          state={props.state} index={x}
          row={props.row} col={props.col}
          moves={props.moves}
          selections={props.selections}
          controller={props.controller}
          />))
        }
        </td>)

}

const BoardRow = (props) => {

  return (<tr>
    {
      MakeRange(BOARD_SIZE).map( (col) => (
          <BoardCell key={"r"+props.row+"c"+col}
          state={props.state} row={props.row} col={col}
          moves={props.moves}
          selections={props.selections}
          controller={props.controller}/>
      ))
    }
  </tr>)
}

const GameState = (props) => {
  return (
    <table>
      <tbody>
      {
        MakeRange(BOARD_SIZE).map( (r) => (
          <BoardRow key={"row"+r} row={r}
          state={props.state}
          moves={props.moves}
          selections={props.selections}
          controller={props.controller}/>
        ))
      }
      </tbody>
    </table>
  )
}

function ApplyMove(boardState,interfaceState) {
  return MakeRange(NUM_PEGS).map(
    (i) => (i!=interfaceState[0]
        && i!=interfaceState[1]
        && i!=interfaceState[2]) ?
      boardState[i] : !boardState[i]
  )
}


const PrettyBoard = (props) => {
  const scaled_size = (BOARD_SIZE+2)*props.scale;
  const scaled_radius = props.scale/4;
  const stroke_width = props.scale/10;
  const on_click = (e) => {
    console.log("Clicked Event! "+e)
  } ;


  return (
    <svg width={scaled_size} height={scaled_size}
    >
    {
      MakeRange(NUM_PEGS).map(
        (p) => (props.state[p] ?
            (<circle
            cx={(PEG_COORDINATES[p][0]+1)*props.scale}
            cy={(PEG_COORDINATES[p][1]+1)*props.scale}
            fill="teal"
            r={scaled_radius}/>) :
            (<circle
            cx={(PEG_COORDINATES[p][0]+1)*props.scale}
            cy={(PEG_COORDINATES[p][1]+1)*props.scale}
            r={scaled_radius}
            fill="none" stroke="teal"
            stroke-width={stroke_width}/>)
          )
      )
    }
    </svg>
  )
}

const GameBoard = (props) => {
  const [boardState, setBoardState] = useState(INITIAL_STATE);
  const [interfaceState, setInterfaceState] = useState([-1,-1,-1]);

  const clearSelection = () => {
    setInterfaceState([-1,-1,-1])
  };

  const resetGame = () => {
    if (window.confirm("Are you sure you want to reset all progress?")) {
      setBoardState(INITIAL_STATE);
      setInterfaceState([-1,-1,-1]);
    }
  };

  const moveList = ValidMoves(boardState);
  const peices_left = boardState.filter((x) => (x)).length;

  console.log("moveList: "+moveList)

  useEffect(() => {
    if (interfaceState[2] > 0) {
      // move confirmed
      console.log("Attempting to confirm move!")
      setBoardState(ApplyMove(boardState,interfaceState))
      setInterfaceState([-1,-1,-1])
    }
  }, [interfaceState])



  return (<div>

          {
            ((interfaceState[0] < 0) ?
             (<p>Select piece to move</p>) :
             ((interfaceState[1] < 0) ?
             (<p>Select destination</p>) :
             ((interfaceState[2] < 0) ?
              (<p>Confirm removed peg</p>) :
             (<p>Processing move...</p>))
           ))
          }
      <GameState
        state={boardState}
        moves={moveList}
        selections={interfaceState}
        controller={setInterfaceState}/>
    <p><button onClick={resetGame}>Reset</button>
    <button onClick={clearSelection} disabled={interfaceState[0]<0}>Clear Selection</button>
    </p>
    </div>
  );
}

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <GameBoard/>

        <p>
          This is an implentation of the peg-game described in
          Session 17 of Lawvere and Schanuel:
        </p>
      </header>
    </div>
  );
}

export default App;
