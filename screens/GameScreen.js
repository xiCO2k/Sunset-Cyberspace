import { GraphicsView } from 'expo-graphics';
import ExpoTHREE, { THREE } from '../expo-three';
import React from 'react';

import TouchableView from '../components/TouchableView';
import Colors from '../constants/Colors';
import Game from '../game/Game';
import DisableBodyScrollingView from '../components/DisableBodyScrollingView';
import KeyboardControlsView from '../components/KeyboardControlsView';

require('three/examples/js/shaders/FXAAShader');

class GameScreen extends React.Component {
  shouldComponentUpdate = (nextProps, nextState) => false;
  game = {};

  render = () => (
    <DisableBodyScrollingView>
      <KeyboardControlsView
        onDown={({ code }) => {
          console.log('press', code);
          if (this.game) {
            if (code === 'ArrowRight' || code === 'KeyD') {
              this.game.onRight();
            } else if (code === 'ArrowLeft' || code === 'KeyA') {
              this.game.onLeft();
            }
          }
        }}
        onUp={e => {
          if (this.game) this.game.onKeyUp(e);
        }}
      >
        <TouchableView
          id="game"
          shouldCancelWhenOutside={false}
          onTouchesBegan={event => this.game.onTouchesBegan(event)}
          onTouchesMoved={event => this.game.onTouchesMoved(event)}
          onTouchesEnded={event => this.game.onTouchesEnded(event)}
        >
          <GraphicsView
            style={{ flex: 1 }}
            onContextCreate={this.onContextCreate}
            onRender={this.onRender}
            onResize={this.onResize}
          />
        </TouchableView>
      </KeyboardControlsView>
    </DisableBodyScrollingView>
  );

  onContextCreate = async ({ gl, width, height, scale, pixelRatio }) => {
    global.supportsEffects = gl.createRenderbuffer != null;

    gl.createRenderbuffer = gl.createRenderbuffer || (() => ({}));
    gl.bindRenderbuffer = gl.bindRenderbuffer || (() => ({}));
    gl.renderbufferStorage = gl.renderbufferStorage || (() => ({}));
    gl.framebufferRenderbuffer = gl.framebufferRenderbuffer || (() => ({}));

    const crazy = false;

    // renderer
    this.renderer = new ExpoTHREE.Renderer({
      width,
      height,
      gl,
      pixelRatio,
      precision: 'highp',
      antialias: false, //crazy ? true : false,
      stencil: false,
      maxLights: crazy ? 4 : 2,
    });
    this.renderer.setClearColor(Colors.dark);

    // scene
    this.scene = new THREE.Scene();

    /// Standard Camera
    this.camera = new THREE.PerspectiveCamera(75, width / height, 1, 10500);
    // this.controls = new THREE.OrbitControls(this.camera);

    // setup custom world
    await this._setupWorld();
    this.onResize({ width, height, scale });
  };

  _setupWorld = async () => {
    this.game = new Game(
      this.camera,
      this.scene,
      this.renderer,
      this.props.onPlay,
      this.props.updateScore,
    );
    await this.game.init();
    this.props.onGameLoaded();
  };

  onResize = ({ width, height, scale }) => {
    if (!this.game) {
      return;
    }
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setPixelRatio(scale);
    this.renderer.setSize(width, height);
    this.game.onResize({ width, height, scale });
  };

  onRender = delta => {
    this.game.animate(delta);
  };
}

export default GameScreen;
