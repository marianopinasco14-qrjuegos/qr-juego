"use client";
import { useEffect } from "react";

interface Props {
  metaPixelId?: string | null;
  googleAnalyticsId?: string | null;
  tiktokPixelId?: string | null;
}

export default function TrackingPixels({ metaPixelId, googleAnalyticsId, tiktokPixelId }: Props) {
  useEffect(() => {
    // ── Setup global trackQREvent ──────────────────────────────────────────────
    (window as any).trackQREvent = (eventName: string, params?: object) => {
      if (metaPixelId && (window as any).fbq) {
        (window as any).fbq("track", eventName, params);
      }
      if (googleAnalyticsId && (window as any).gtag) {
        (window as any).gtag("event", eventName, params);
      }
      if (tiktokPixelId && (window as any).ttq) {
        (window as any).ttq.track(eventName, params);
      }
    };

    // ── Meta Pixel ─────────────────────────────────────────────────────────────
    if (metaPixelId && !(window as any).fbq) {
      const inlineScript = document.createElement("script");
      inlineScript.innerHTML = `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${metaPixelId}');fbq('track','PageView');`;
      document.head.appendChild(inlineScript);
    }

    // ── Google Analytics 4 ─────────────────────────────────────────────────────
    if (googleAnalyticsId && !(window as any).gtag) {
      const gaScript = document.createElement("script");
      gaScript.async = true;
      gaScript.src = `https://www.googletagmanager.com/gtag/js?id=${googleAnalyticsId}`;
      const firstScript = document.getElementsByTagName("script")[0];
      firstScript.parentNode?.insertBefore(gaScript, firstScript);

      const gtagInline = document.createElement("script");
      gtagInline.innerHTML = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${googleAnalyticsId}');`;
      document.head.appendChild(gtagInline);
    }

    // ── TikTok Pixel ───────────────────────────────────────────────────────────
    if (tiktokPixelId && !(window as any).ttq) {
      const ttScript = document.createElement("script");
      ttScript.innerHTML = `!function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};ttq.load('${tiktokPixelId}');ttq.page();}(window,document,'ttq');`;
      const firstScript = document.getElementsByTagName("script")[0];
      firstScript.parentNode?.insertBefore(ttScript, firstScript);
    }
  }, []);

  return null;
}

// ── Helper functions ───────────────────────────────────────────────────────────

export function trackPageView() {
  if (typeof window !== "undefined" && (window as any).trackQREvent) {
    (window as any).trackQREvent("PageView");
  }
}

export function trackLead() {
  if (typeof window !== "undefined" && (window as any).trackQREvent) {
    (window as any).trackQREvent("Lead");
  }
}

export function trackWin() {
  if (typeof window !== "undefined" && (window as any).trackQREvent) {
    (window as any).trackQREvent("CompleteRegistration");
  }
}
