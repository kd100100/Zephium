//! Native video PiP in a dedicated content world, scoped to an ordinary tab.
use objc2::rc::Retained;
use objc2::runtime::AnyObject;
use objc2_foundation::{MainThreadMarker, NSError, NSString};
use objc2_web_kit::WKContentWorld;
use std::cell::{Cell, OnceCell};
use std::rc::Rc;

/// The world the program keeps its state in between calls, among it the
/// video it put in picture in picture and has to bring back. WebKit discards
/// a named world, and every global in it, once nothing holds it.
fn world(mtm: MainThreadMarker) -> Retained<WKContentWorld> {
    thread_local! {
        static WORLD: OnceCell<Retained<WKContentWorld>> = const { OnceCell::new() };
    }
    WORLD.with(|world| {
        world
            // SAFETY: `mtm` proves main-thread creation and the name is a live
            // retained NSString.
            .get_or_init(|| unsafe {
                WKContentWorld::worldWithName(
                    &NSString::from_str("zephium-automatic-video-pip"),
                    mtm,
                )
            })
            .clone()
    })
}

const DOCUMENT_LEFT_FULLSCREEN: &str =
    "if (document.fullscreenElement || document.webkitFullscreenElement) \
     await new Promise(resolve => { \
       document.addEventListener('fullscreenchange', resolve, { once: true }); \
       document.addEventListener('webkitfullscreenchange', resolve, { once: true }); \
       setTimeout(resolve, 1000); \
     });";

pub(crate) fn automatic_pip(view: &wry::WebView, script: String, current: Rc<dyn Fn() -> bool>) {
    let Some(mtm) = MainThreadMarker::new() else {
        return;
    };
    if !current() {
        return;
    }
    let page = super::native_webview(view);
    let done = block2::RcBlock::new(|_: *mut AnyObject, _: *mut NSError| {});
    unsafe {
        let world = world(mtm);
        page.evaluateJavaScript_inFrame_inContentWorld_completionHandler(
            &NSString::from_str(&script),
            None,
            &world,
            Some(&done),
        );
    }
}

/// Calls `done` once the page's document has left element fullscreen, or
/// after a second if it does not say so.
pub(crate) fn after_document_fullscreen(view: &wry::WebView, done: impl FnOnce() + 'static) {
    let Some(mtm) = MainThreadMarker::new() else {
        return;
    };
    let page = super::native_webview(view);
    let done = Cell::new(Some(done));
    let completion = block2::RcBlock::new(move |_: *mut AnyObject, _: *mut NSError| {
        if let Some(done) = done.take() {
            done();
        }
    });
    let world = world(mtm);
    // SAFETY: main-thread WebKit call with a retained view and world; WebKit
    // copies the completion block.
    unsafe {
        page.callAsyncJavaScript_arguments_inFrame_inContentWorld_completionHandler(
            &NSString::from_str(DOCUMENT_LEFT_FULLSCREEN),
            None,
            None,
            &world,
            Some(&completion),
        );
    }
}
