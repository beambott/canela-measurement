import { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Image as KonvaImage, Line, Text } from 'react-konva';
import useImage from 'use-image';
import './App.css';

const PAW_TEMPLATE_URL = 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Paw_print_icon.svg/2048px-Paw_print_icon.svg.png';
const SAMPLE_BOTTOM = 'https://i.imgur.com/VsD6Sh8.jpg';
const SAMPLE_SIDE = 'https://i.imgur.com/MVvNU7e.jpg';
const SAMPLE_FRONT = 'https://i.imgur.com/placeholder_front.jpg'; // replace with your sample

function App() {
  const [step, setStep] = useState(1);
  const [dogInfo, setDogInfo] = useState({ breed: '', sex: '', age: '', weight: '', owner: '' });

  const [bottomImgUrl, setBottomImgUrl] = useState(null);
  const [sideImgUrl, setSideImgUrl] = useState(null);
  const [frontImgUrl, setFrontImgUrl] = useState(null);

  const [bottomImage, bottomStatus] = useImage(bottomImgUrl, 'anonymous');
  const [sideImage, sideStatus] = useImage(sideImgUrl, 'anonymous');
  const [frontImage, frontStatus] = useImage(frontImgUrl, 'anonymous');
  const [template] = useImage(PAW_TEMPLATE_URL);

  const [imgSize, setImgSize] = useState({ width: 600, height: 600 });
  const [scale, setScale] = useState(1);

  const [isDrawing, setIsDrawing] = useState(false);
  const [tempLine, setTempLine] = useState(null);

  const [pixelsPerCmBottom, setPixelsPerCmBottom] = useState(null);
  const [pixelsPerCmSide, setPixelsPerCmSide] = useState(null);
  const [pixelsPerCmFront, setPixelsPerCmFront] = useState(null);

  const [measurements, setMeasurements] = useState({ length: null, width: null, height: null, thickness: null });
  const [confirmBottom, setConfirmBottom] = useState(false);
  const [confirmSide, setConfirmSide] = useState(false);
  const [confirmFront, setConfirmFront] = useState(false);

  const stageRef = useRef(null);

  // Determine which image to show based on step
  const getCurrent = () => {
    if (step >= 2 && step <= 4) return bottomImage;
    if (step >= 6 && step <= 7) return sideImage;
    if (step >= 9 && step <= 10) return frontImage;
    return null;
  };

  // Resize canvas when image loads
  useEffect(() => {
    const img = getCurrent();
    const status = img === bottomImage ? bottomStatus : img === sideImage ? sideStatus : frontStatus;
    if (img && status === 'loaded') {
      const maxW = 600, maxH = 600;
      const factor = Math.min(maxW / img.width, maxH / img.height, 1);
      setScale(factor);
      setImgSize({ width: img.width * factor, height: img.height * factor });
    }
  }, [step, bottomStatus, sideStatus, frontStatus]);

  // Upload handler advances step for side & front
  const handleUpload = (e, view) => {
    const file = e.target.files[0]; if (!file) return;
    const url = URL.createObjectURL(file);
    if (view === 'bottom') setBottomImgUrl(url);
    if (view === 'side') {
      setSideImgUrl(url);
      setStep(6);
    }
    if (view === 'front') {
      setFrontImgUrl(url);
      setStep(9);
    }
    setTempLine(null);
    setIsDrawing(false);
  };

  const handleMouseDown = (e) => {
    const pos = e.target.getStage().getPointerPosition();
    setTempLine([pos.x / scale, pos.y / scale]);
    setIsDrawing(true);
  };

  const handleMouseMove = (e) => {
    if (!isDrawing || !tempLine) return;
    const pos = e.target.getStage().getPointerPosition();
    setTempLine([tempLine[0], tempLine[1], pos.x / scale, pos.y / scale]);
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
    if (!tempLine || tempLine.length !== 4) return;
    const [x1, y1, x2, y2] = tempLine;
    const pixels = Math.hypot(x2 - x1, y2 - y1);

    // Branch by step
    if (step === 2) {
      setPixelsPerCmBottom(pixels / 5);
      setStep(3);
      alert('✅ Bottom scale set. Draw LENGTH.');
    } else if (step === 3) {
      setMeasurements(prev => ({ ...prev, length: { points: tempLine, cm: pixels / pixelsPerCmBottom } }));
      setStep(4);
      alert('✅ Length recorded. Draw WIDTH.');
    } else if (step === 4) {
      setMeasurements(prev => ({ ...prev, width: { points: tempLine, cm: pixels / pixelsPerCmBottom } }));
    } else if (step === 6) {
      setPixelsPerCmSide(pixels / 5);
      setStep(7);
      alert('✅ Side scale set. Draw HEIGHT.');
    } else if (step === 7) {
      setMeasurements(prev => ({ ...prev, height: { points: tempLine, cm: pixels / pixelsPerCmSide } }));
    } else if (step === 9) {
      setPixelsPerCmFront(pixels / 5);
      setStep(10);
      alert('✅ Front scale set. Draw THICKNESS.');
    } else if (step === 10) {
      setMeasurements(prev => ({ ...prev, thickness: { points: tempLine, cm: pixels / pixelsPerCmFront } }));
    }

    setTempLine(null);
  };

  // Renders lines + labels
  const renderLine = (label, data, dy = 0) => {
    if (!data) return null;
    const [x1, y1, x2, y2] = data.points;
    const midX = ((x1 + x2) / 2) * scale;
    const midY = ((y1 + y2) / 2) * scale - 20 + dy;
    return (
      <>
        <Line points={[x1, y1, x2, y2].map(p => p * scale)} stroke="red" strokeWidth={2} />
        <Text x={midX} y={midY} text={`${label}: ${data.cm.toFixed(2)} cm`} fontSize={14} />
      </>
    );
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Paw Measurement Tool</h2>

      {/* 1: Dog Info */}
      {step === 1 && (
        <div>
          <h4>Dog Info</h4>
          {['breed','sex','age','weight','owner'].map(f => (
            <div key={f}>
              <label>{f.charAt(0).toUpperCase()+f.slice(1)}:</label>
              <input value={dogInfo[f]} onChange={e=>setDogInfo({...dogInfo,[f]:e.target.value})} />
            </div>
          ))}
          <button onClick={()=>setStep(2)}>Start</button>
        </div>
      )}

      {/* 2: Bottom Upload */}
      {step===2 && !bottomImgUrl && (
        <div>
          <p>Upload bottom paw + ruler</p>
          <img src={SAMPLE_BOTTOM} alt="sample" style={{width:300}} />
          <input type="file" onChange={e=>handleUpload(e,'bottom')} />
        </div>
      )}

      {/* 2-4: Bottom Measuring */}
      {(step>=2 && step<=4) && bottomImage && (
        <>
          <p>{step===2?'Draw 5cm reference':'Draw '+(step===3?'Length':'Width')}</p>
          <Stage ref={stageRef} width={imgSize.width} height={imgSize.height}
            onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}>
            <Layer>
              <KonvaImage image={bottomImage} scale={{x:scale,y:scale}} />
              {template && <KonvaImage image={template} scale={{x:scale,y:scale}} opacity={0.15}/>}
              {renderLine('Length',measurements.length)}
              {renderLine('Width',measurements.width,20)}
              {tempLine && <Line points={tempLine.map(p=>p*scale)} stroke="blue" strokeWidth={2} dash={[4,4]} />}
            </Layer>
          </Stage>
          {step===4 && measurements.length && measurements.width && (
            <div>
              <p>Bottom: L {measurements.length.cm.toFixed(2)}cm, W {measurements.width.cm.toFixed(2)}cm</p>
              <button onClick={()=>{setConfirmBottom(true);setStep(5);}}>Confirm</button>
              <button onClick={()=>{setPixelsPerCmBottom(null);setMeasurements({});setStep(2);}}>Rescale</button>
            </div>
          )}
        </>
      )}

      {/* 5: Side Upload */}
      {step===5 && (
        <div>
          <p>Upload side view + ruler</p>
          <img src={SAMPLE_SIDE} alt="sample" style={{width:300}} />
          <input type="file" onChange={e=>handleUpload(e,'side')} />
        </div>
      )}

      {/* 6-7: Side Measuring */}
      {(step>=6 && step<=7) && sideImage && (
        <>
          <p>{step===6?'Draw 5cm reference':'Draw Height'}</p>
          <Stage ref={stageRef} width={imgSize.width} height={imgSize.height}
            onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}>
            <Layer>
              <KonvaImage image={sideImage} scale={{x:scale,y:scale}} />
              {template && <KonvaImage image={template} scale={{x:scale,y:scale}} opacity={0.15}/>}
              {renderLine('Height',measurements.height)}
              {tempLine && <Line points={tempLine.map(p=>p*scale)} stroke="blue" strokeWidth={2} dash={[4,4]} />}
            </Layer>
          </Stage>
          {step===7 && measurements.height && (
            <div>
              <p>Height: {measurements.height.cm.toFixed(2)}cm</p>
              <button onClick={()=>{setConfirmSide(true);setStep(8);}}>Confirm</button>
              <button onClick={()=>{setPixelsPerCmSide(null);setMeasurements(prev=>({...prev,height:null}));setStep(5);}}>Rescale</button>
            </div>
          )}
        </>
      )}

      {/* 8: Front Upload */}
      {step===8 && confirmBottom && confirmSide && (
        <div>
          <p>Upload front view + ruler</p>
          <img src={SAMPLE_FRONT} alt="sample" style={{width:300}} />
          <input type="file" onChange={e=>handleUpload(e,'front')} />
        </div>
      )}

      {/* 9-10: Front Measuring */}
      {(step===9||step===10) && frontImage && (
        <>
          <p>{step===9?'Draw 5cm reference':'Draw Thickness'}</p>
          <Stage ref={stageRef} width={imgSize.width} height={imgSize.height}
            onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}>
            <Layer>
              <KonvaImage image={frontImage} scale={{x:scale,y:scale}} />
              {template && <KonvaImage image={template} scale={{x:scale,y:scale}} opacity={0.15}/>}
              {renderLine('Thickness',measurements.thickness)}
              {tempLine && <Line points={tempLine.map(p=>p*scale)} stroke="blue" strokeWidth={2} dash={[4,4]} />}
            </Layer>
          </Stage>
          {step===10 && measurements.thickness && (
            <div>
              <p>Thickness: {measurements.thickness.cm.toFixed(2)}cm</p>
              <button onClick={()=>{setConfirmFront(true);setStep(11);}}>Confirm</button>
              <button onClick={()=>{setPixelsPerCmFront(null);setMeasurements(prev=>({...prev,thickness:null}));setStep(8);}}>Rescale</button>
            </div>
          )}
        </>
      )}

      {/* 11: Final Summary */}
      {step===11 && confirmBottom && confirmSide && confirmFront && (
        <div>
          <h3>Final Measurements</h3>
          <p>Length: {measurements.length.cm.toFixed(2)} cm</p>
          <p>Width: {measurements.width.cm.toFixed(2)} cm</p>
          <p>Height: {measurements.height.cm.toFixed(2)} cm</p>
          <p>Thickness: {measurements.thickness.cm.toFixed(2)} cm</p>
        </div>
      )}
    </div>
  );
}

export default App;