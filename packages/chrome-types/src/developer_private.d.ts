// Copyright 2021 The Chromium Authors
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
/** @fileoverview Definitions for chrome.developerPrivate API */
// TODO(crbug.com/1203307): Auto-generate this file.
/// <reference path="chrome_event.d.ts" />

/**
 * developerPrivate API.
 * This is a private API exposing developing and debugging functionalities for
 * apps and extensions.
 *
 * @see {@link https://chromium.googlesource.com/chromium/src/+/main/chrome/common/extensions/api/developer_private.idl Developer Private IDL}
 * @see {@link https://chromium.googlesource.com/chromium/src/+/main/tools/typescript/definitions/developer_private.d.ts Developer Private TypeScript Definitions}
 */
declare namespace chrome.developerPrivate {
  /**
   * @deprecated Prefer {@link ExtensionType}.
   */
  export enum ItemType {
    HOSTED_APP = 'hosted_app',
    PACKAGED_APP = 'packaged_app',
    LEGACY_PACKAGED_APP = 'legacy_packaged_app',
    EXTENSION = 'extension',
    THEME = 'theme',
  }

  /**
   * @deprecated Prefer {@link ExtensionView}.
   */
  export interface ItemInspectView {
    /** path to the inspect page. */
    path: string;
    /** For lazy background pages, the value is -1. */
    render_process_id: number;
    /** This actually refers to a render frame. */
    render_view_id: number;
    incognito: boolean;
    generatedBackgroundPage: boolean;
  }

  export interface InstallWarning {
    message: string;
  }

  export enum ExtensionType {
    HOSTED_APP = 'HOSTED_APP',
    PLATFORM_APP = 'PLATFORM_APP',
    LEGACY_PACKAGED_APP = 'LEGACY_PACKAGED_APP',
    EXTENSION = 'EXTENSION',
    THEME = 'THEME',
    SHARED_MODULE = 'SHARED_MODULE',
  }

  export enum Location {
    FROM_STORE = 'FROM_STORE',
    UNPACKED = 'UNPACKED',
    THIRD_PARTY = 'THIRD_PARTY',
    INSTALLED_BY_DEFAULT = 'INSTALLED_BY_DEFAULT',
    /**
     * "Unknown" includes crx's installed from chrome://extensions.
     */
    UNKNOWN = 'UNKNOWN',
  }

  export enum ViewType {
    APP_WINDOW = 'APP_WINDOW',
    BACKGROUND_CONTENTS = 'BACKGROUND_CONTENTS',
    COMPONENT = 'COMPONENT',
    EXTENSION_BACKGROUND_PAGE = 'EXTENSION_BACKGROUND_PAGE',
    EXTENSION_DIALOG = 'EXTENSION_DIALOG',
    EXTENSION_GUEST = 'EXTENSION_GUEST',
    EXTENSION_POPUP = 'EXTENSION_POPUP',
    EXTENSION_SERVICE_WORKER_BACKGROUND = 'EXTENSION_SERVICE_WORKER_BACKGROUND',
    TAB_CONTENTS = 'TAB_CONTENTS',
    EXTENSION_SIDE_PANEL = 'EXTENSION_SIDE_PANEL',
  }

  export enum ErrorType {
    MANIFEST = 'MANIFEST',
    RUNTIME = 'RUNTIME',
  }

  export enum ErrorLevel {
    LOG = 'LOG',
    WARN = 'WARN',
    ERROR = 'ERROR',
  }

  export enum ExtensionState {
    ENABLED = 'ENABLED',
    DISABLED = 'DISABLED',
    TERMINATED = 'TERMINATED',
    BLACKLISTED = 'BLACKLISTED',
  }

  export enum ComandScope {
    GLOBAL = 'GLOBAL',
    CHROME = 'CHROME',
  }

  export interface GetExtensionsInfoOptions {
    includeDisabled?: boolean;
    includeTerminated?: boolean;
  }

  export enum CommandScope {
    GLOBAL = 'GLOBAL',
    CHROME = 'CHROME',
  }

  export interface AccessModifier {
    isEnabled: boolean;
    isActive: boolean;
  }

  export interface StackFrame {
    lineNumber: number;
    columnNumber: number;
    url: string;
    functionName: string;
  }

  export interface ManifestError {
    type: ErrorType;
    extensionId: string;
    fromIncognito: boolean;
    source: string;
    message: string;
    id: number;
    manifestKey: string;
    manifestSpecific?: string;
  }

  export interface RuntimeError {
    type: ErrorType;
    extensionId: string;
    fromIncognito: boolean;
    source: string;
    message: string;
    id: number;
    severity: ErrorLevel;
    contextUrl: string;
    occurrences: number;
    renderViewId: number;
    renderProcessId: number;
    canInspect: boolean;
    stackTrace: StackFrame[];
  }

  export interface DisableReasons {
    suspiciousInstall: boolean;
    corruptInstall: boolean;
    updateRequired: boolean;
    publishedInStoreRequired: boolean;
    blockedByPolicy: boolean;
    reloading: boolean;
    custodianApprovalRequired: boolean;
    parentDisabledPermissions: boolean;
  }

  export interface OptionsPage {
    openInTab: boolean;
    url: string;
  }

  export interface HomePage {
    url: string;
    specified: boolean;
  }

  export interface ExtensionView {
    url: string;
    /** This actually refers to a render frame. */
    renderProcessId: number;
    renderViewId: number;
    incognito: boolean;
    isIframe: boolean;
    type: ViewType;
  }

  export enum HostAccess {
    ON_CLICK = 'ON_CLICK',
    ON_SPECIFIC_SITES = 'ON_SPECIFIC_SITES',
    ON_ALL_SITES = 'ON_ALL_SITES',
  }

  export interface SafetyCheckStrings {
    panelString?: string;
    detailString?: string;
  }

  export interface ControlledInfo {
    text: string;
  }

  export interface Command {
    description: string;
    keybinding: string;
    name: string;
    isActive: boolean;
    scope: CommandScope;
    isExtensionAction: boolean;
  }

  export interface DependentExtension {
    id: string;
    name: string;
  }

  export interface Permission {
    message: string;
    submessages: string[];
  }

  export interface SiteControl {
    /** The host pattern for the site. */
    host: string;
    /** Whether the pattern has been granted. */
    granted: boolean;
  }

  export interface RuntimeHostPermissions {
    /** True if {@link hosts} contains an all hosts like pattern. */
    hasAllHosts: boolean;
    /** The current HostAccess setting for the extension. */
    hostAccess: HostAccess;
    /** The site controls for all granted and requested patterns. */
    hosts: chrome.developerPrivate.SiteControl[];
  }

  export interface Permissions {
    simplePermissions: chrome.developerPrivate.Permission[];
    /**
     * Only populated for extensions that can be affected by the runtime host
     * permissions feature.
     */
    runtimeHostPermissions?: RuntimeHostPermissions;
    /**
     * True if the extension can access site data through host permissions or
     * API permissions such as activeTab.
     */
    canAccessSiteData: boolean;
  }

  export interface ExtensionInfo {
    blacklistText?: string;
    safetyCheckText?: SafetyCheckStrings;
    commands: Command[];
    controlledInfo?: ControlledInfo;
    dependentExtensions: DependentExtension[];
    description: string;
    disableReasons: DisableReasons;
    errorCollection: AccessModifier;
    fileAccess: AccessModifier;
    homePage: HomePage;
    iconUrl: string;
    id: string;
    incognitoAccess: AccessModifier;
    installWarnings: string[];
    launchUrl?: string;
    location: Location;
    locationText?: string;
    manifestErrors: ManifestError[];
    manifestHomePageUrl: string;
    mustRemainInstalled: boolean;
    name: string;
    offlineEnabled: boolean;
    optionsPage?: OptionsPage;
    path?: string;
    permissions: Permissions;
    prettifiedPath?: string;
    runtimeErrors: RuntimeError[];
    runtimeWarnings: string[];
    state: ExtensionState;
    type: ExtensionType;
    updateUrl: string;
    userMayModify: boolean;
    version: string;
    views: ExtensionView[];
    webStoreUrl: string;
    showSafeBrowsingAllowlistWarning: boolean;
    showAccessRequestsInToolbar: boolean;
    acknowledgeSafetyCheckWarning: boolean;
    pinnedToToolbar?: boolean;
  }

  export interface ProfileInfo {
    canLoadUnpacked: boolean;
    inDeveloperMode: boolean;
    isDeveloperModeControlledByPolicy: boolean;
    isIncognitoAvailable: boolean;
    isChildAccount: boolean;
  }

  export interface ExtensionConfigurationUpdate {
    extensionId: string;
    fileAccess?: boolean;
    incognitoAccess?: boolean;
    errorCollection?: boolean;
    hostAccess?: HostAccess;
    showAccessRequestsInToolbar?: boolean;
    acknowledgeSafetyCheckWarning?: boolean;
    pinnedToToolbar?: boolean;
  }

  export interface ProfileConfigurationUpdate {
    inDeveloperMode: boolean;
  }

  export interface ExtensionCommandUpdate {
    extensionId: string;
    commandName: string;
    scope?: CommandScope;
    keybinding?: string;
  }

  export interface ReloadOptions {
    /**
     * If false, an alert dialog will show in the event of a reload error.
     *
     * @default false
     */
    failQuietly?: boolean;
    /**
     * If true, populates a LoadError for the response rather than setting
     * lastError. Only relevant for unpacked extensions; it will be ignored for
     * any other extension.
     */
    populateErrorForUnpacked?: boolean;
  }

  export interface LoadUnpackedOptions {
    /**
     * If false, an alert dialog will show in the event of a reload error.
     *
     * @default false
     */
    failQuietly?: boolean;
    /**
     * If true, populates a LoadError for the response rather than setting
     * lastError.
     */
    populateError?: boolean;
    /**
     * A unique identifier for retrying a previous failed load. This should be
     * the identifier returned in the LoadError. If specified, the path
     * associated with the identifier will be loaded, and the file chooser
     * will be skipped.
     */
    retryGuid?: string;

    /**
     * True if the function should try to load an extension from the drop data
     * of the page. {@link notifyDragInstallInProgress notifyDragInstallInProgress()} needs to be called prior to
     * this being used. This cannot be used with {@link retryGuid}.
     */
    useDraggedPath?: boolean;
  }

  export enum PackStatus {
    SUCCESS = 'SUCCESS',
    ERROR = 'ERROR',
    WARNING = 'WARNING',
  }

  export enum FileType {
    LOAD = 'LOAD',
    PEM = 'PEM',
  }

  export enum SelectType {
    FILE = 'FILE',
    FOLDER = 'FOLDER',
  }

  export enum EventType {
    INSTALLED = 'INSTALLED',
    UNINSTALLED = 'UNINSTALLED',
    LOADED = 'LOADED',
    UNLOADED = 'UNLOADED',
    /**
     * New window / view opened.
     */
    VIEW_REGISTERED = 'VIEW_REGISTERED',
    /**
     * window / view closed.
     */
    VIEW_UNREGISTERED = 'VIEW_UNREGISTERED',
    ERROR_ADDED = 'ERROR_ADDED',
    ERRORS_REMOVED = 'ERRORS_REMOVED',
    PREFS_CHANGED = 'PREFS_CHANGED',
    WARNINGS_CHANGED = 'WARNINGS_CHANGED',
    COMMAND_ADDED = 'COMMAND_ADDED',
    COMMAND_REMOVED = 'COMMAND_REMOVED',
    PERMISSIONS_CHANGED = 'PERMISSIONS_CHANGED',
    SERVICE_WORKER_STARTED = 'SERVICE_WORKER_STARTED',
    SERVICE_WORKER_STOPPED = 'SERVICE_WORKER_STOPPED',
    CONFIGURATION_CHANGED = 'CONFIGURATION_CHANGED',
    PINNED_ACTIONS_CHANGED = 'PINNED_ACTIONS_CHANGED',
  }

  /**
   * Describes which set of sites a given url/string is associated with. Note
   * that a site can belong to multiple sets at the same time.
   */
  export enum SiteSet {
    /**
     * The site is specified by the user to automatically grant access to all
     * extensions with matching host permissions. Mutually exclusive with
     * USER_RESTRICTED but takes precedence over EXTENSION_SPECIFIED.
     */
    USER_PERMITTED = 'USER_PERMITTED',
    /**
     * The site is specified by the user to disallow all extensions from running
     * on it. Mutually exclusive with USER_PERMITTED but takes precedence over
     * EXTENSION_SPECIFIED.
     */
    USER_RESTRICTED = 'USER_RESTRICTED',
    /**
     * The site is specified by one or more extensions' set of host permissions.
     */
    EXTENSION_SPECIFIED = 'EXTENSION_SPECIFIED',
  }

  export interface PackDirectoryResponse {
    /**
     * The response message of success or error.
     */
    message: string;
    /**
     * Unpacked items's path.
     */
    item_path: string;
    /**
     * Permanent key path.
     */
    pem_path: string;
    override_flags: number;
    status: PackStatus;
  }

  export interface EventData {
    event_type: EventType;
    item_id: string;
    extensionInfo?: ExtensionInfo;
  }

  export interface ErrorFileSource {
    /**
     * The region before the "highlight" portion.
     * If the region which threw the error was not found, the full contents of
     * the file will be in the "beforeHighlight" section.
     */
    beforeHighlight: string;
    /**
     * The region of the code which threw the error, and should be highlighted.
     */
    highlight: string;
    /**
     * The region after the "highlight" portion.
     */
    afterHighlight: string;
  }

  export interface LoadError {
    /**
     * The error that occurred when trying to load the extension.
     */
    error: string;
    /**
     * The path to the extension.
     */
    path: string;
    /**
     * The file source for the error, if it could be retrieved.
     */
    source?: ErrorFileSource;
    /**
     * A unique identifier to pass to developerPrivate.loadUnpacked to retry
     * loading the extension at the same path.
     */
    retryGuid: string;
  }

  export interface RequestFileSourceProperties {
    /**
     * The ID of the extension owning the file.
     */
    extensionId: string;
    /**
     * The path of the file, relative to the extension; e.g., manifest.json,
     * script.js, or main.html.
     */
    pathSuffix: string;
    /**
     * The error message which was thrown as a result of the error in the file.
     */
    message: string;
    /**
     * The key in the manifest which caused the error (e.g., "permissions").
     * (Required for "manifest.json" files)
     */
    manifestKey?: string;
    /**
     * The specific portion of the manifest key which caused the error (e.g.,
     * "foo" in the "permissions" key). (Optional for "manifest.json" file).
     */
    manifestSpecific?: string;
    /**
     * The line number which caused the error (optional for non-manifest files).
     */
    lineNumber?: number;
  }

  export interface RequestFileSourceResponse {
    /**
     * The region of the code which threw the error, and should be highlighted.
     */
    highlight: string;
    /**
     * The region before the "highlight" portion.
     * If the region which threw the error was not found, the full contents of
     * the file will be in the "beforeHighlight" section.
     */
    beforeHighlight: string;
    /**
     * The region after the "highlight" portion.
     */
    afterHighlight: string;
    /**
     * A title for the file in the form '<extension name>: <file name>'.
     */
    title: string;
    /**
     * The error message.
     */
    message: string;
  }

  export interface OpenDevToolsProperties {
    /**
     * The ID of the extension. This is only needed if opening its background
     * page or its background service worker (where renderViewId and
     * renderProcessId are -1).
     */
    extensionId?: string;
    /**
     * The ID of the render frame in which the error occurred.
     * Despite being called renderViewId, this refers to a render frame.
     */
    renderViewId: number;
    /**
     * The ID of the process in which the error occurred.
     */
    renderProcessId: number;
    /**
     * Whether or not the background is service worker based.
     */
    isServiceWorker?: boolean;
    incognito?: boolean;
    /**
     * The URL in which the error occurred.
     */
    url?: string;
    /**
     * The line to focus the devtools at.
     */
    lineNumber?: number;
    /**
     * The column to focus the devtools at.
     */
    columnNumber?: number;
  }

  export interface DeleteExtensionErrorsProperties {
    extensionId: string;
    errorIds?: number[];
    type?: ErrorType;
  }

  export interface UserSiteSettings {
    /**
     * The list of origins where the user has allowed all extensions to run on.
     */
    permittedSites: string[];
    /**
     * The list of origins where the user has blocked all extensions from
     * running on.
     */
    restrictedSites: string[];
  }

  export interface UserSiteSettingsOptions {
    /**
     * Specifies which set of user specified sites that the host will be added
     * to or removed from.
     */
    siteSet: SiteSet;
    /**
     * The sites to add/remove.
     */
    hosts: string[];
  }

  export interface SiteInfo {
    /**
     * The site set that `site` belongs to.
     */
    siteSet: SiteSet;
    /**
     * The number of extensions with access to `site`.
     * TODO(crbug.com/1331137): A tricky edge case is when one extension
     * specifies something like *.foo.com and another specifies foo.com.
     * Patterns which match all subdomains should be represented differently.
     */
    numExtensions: number;
    /**
     * The site itself. This could either be a user specified site or an
     * extension host permission pattern.
     */
    site: string;
  }

  export interface SiteGroup {
    /**
     * The common effective top level domain plus one (eTLD+1) for all sites in
     * `sites`.
     */
    etldPlusOne: string;
    /**
     * The number of extensions that can run on at least one site inside `sites`
     * for this eTLD+1.
     */
    numExtensions: number;
    /**
     * The list of user or extension specified sites that share the same eTLD+1.
     */
    sites: SiteInfo[];
  }

  export interface MatchingExtensionInfo {
    /**
     * The id of the matching extension.
     */
    id: string;
    /**
     * Describes the extension's access to the queried site from
     * getMatchingExtensionsForSite. Note that the meaning is different from the
     * original enum:
     * - ON_CLICK: The extension requested access to the site but its access is
     *   withheld.
     * - ON_SPECIFIC_SITES: the extension is permitted to run on at least one
     *   site specified by the queried site but it does not request access to
     *   all sites or it has its access withheld on at least one site in its
     *   host permissions.
     * - ON_ALL_SITES: the extension is permitted to run on all sites.
     */
    siteAccess: HostAccess;
    /**
     * Whether the matching extension requests access to all sites in its
     * host permissions.
     */
    canRequestAllSites: boolean;
  }

  export interface ExtensionSiteAccessUpdate {
    /**
     * The id of the extension to update its site access settings for.
     */
    id: string;
    /**
     * Describes the update made to the extension's site access for a given site
     * Note that this has a different meaning from the original enum:
     * - ON_CLICK: Withholds the extension's access to the given site,
     * - ON_SPECIFIC_SITES: Grants the extension access to the intersection of
     *   (given site, extension's specified host permissions.)
     * - ON_ALL_SITES: Grants access to all of the extension's specified host
     *   permissions.
     */
    siteAccess: HostAccess;
  }

  type VoidCallback = () => void;

  type StringCallback = (s: string) => void;

  /**
   * Adds a new host permission to the extension. The extension will only
   * have access to the host if it is within the requested permissions.
   *
   * @param extensionId The id of the extension to modify.
   * @param host The host to add.
   */
  export function addHostPermission(extensionId: string, host: string): Promise<void>;

  /**
   * Runs auto update for extensions and apps immediately.
   */
  export function autoUpdate(): Promise<void>;

  /**
   * Open Dialog to browse to an entry.
   * @param selectType Select a file or a folder.
   * @param fileType Required file type. For example, pem type is for private
   * key and load type is for an unpacked item.
   * @returns called with selected item's path.
   */
  export function choosePath(selectType: SelectType, fileType: FileType): Promise<string>;

  /**
   * Delete reported extension errors.
   *
   * @param properties The properties specifying the errors to remove.
   */
  export function deleteExtensionErrors(properties: DeleteExtensionErrorsProperties): Promise<void>;

  /**
   * Returns information of all the extensions and apps installed.
   *
   * @param options Options to restrict the items returned.
   */
  export function getExtensionsInfo(options?: GetExtensionsInfoOptions): Promise<ExtensionInfo[]>;

  /**
   * Returns information of a particular extension.
   *
   * @param id The id of the extension.
   */
  export function getExtensionInfo(id: string): Promise<ExtensionInfo>;

  /**
   * Returns the size of a particular extension on disk (already formatted).
   *
   * @param id The id of the extension.
   */
  export function getExtensionSize(id: string): Promise<string>;

  /**
   * Returns the current profile's configuration.
   */
  export function getProfileConfiguration(): Promise<ProfileInfo>;

  /**
   * Installs the file that was dragged and dropped onto the associated
   * page.
   */
  export function installDroppedFile(): Promise<void>;

  /**
   * Loads a user-selected unpacked item.
   *
   * @param options Additional configuration parameters.
   */
  export function loadUnpacked(options: LoadUnpackedOptions): Promise<LoadError | null>;

  /**
   * Notifies the browser that a user began a drag in order to install an
   * extension.
   */
  export function notifyDragInstallInProgress(): void;

  /**
   * Open the developer tools to focus on a particular error.
   */
  export function openDevTools(properties: OpenDevToolsProperties): Promise<void>;

  /**
   * Pack an extension.
   *
   * @param rootPath The path of the extension.
   * @param privateKeyPath The path of the private key, if one is given.
   * @param flags Special flags to apply to the loading process, if any.
   * @returns called with the success result string.
   */
  export function packDirectory(path: string, privateKeyPath: string, flags?: number): Promise<PackDirectoryResponse>;

  /**
   * Reloads a given extension.
   *
   * @param extensionId The id of the extension to reload.
   * @param options Additional configuration parameters.
   */
  export function reload(extensionId: string, options?: ReloadOptions): Promise<LoadError | null>;

  /**
   * Removes a host permission from the extension. This should only be called
   * with a host that the extension has access to.
   *
   * @param extensionId The id of the extension to modify.
   * @param host The host to remove.
   */
  export function removeHostPermission(extensionId: string, host: string): Promise<void>;

  /**
   * Removes multiple installed extensions.
   */
  export function removeMultipleExtensions(extensionIds: string[]): Promise<void>;

  /**
   * Repairs the extension specified.
   *
   * @param extensionId The id of the extension to repair.
   */
  export function repairExtension(extensionId: string): Promise<void>;

  /**
   * Reads and returns the contents of a file related to an extension which
   * caused an error.
   */
  export function requestFileSource(properties: RequestFileSourceProperties): Promise<RequestFileSourceResponse>;

  /**
   * (Un)suspends global shortcut handling.
   *
   * @param isSuspended Whether or not shortcut handling should be suspended.
   */
  export function setShortcutHandlingSuspended(isSuspended: boolean): Promise<void>;

  /**
   * Shows the options page for the extension specified.
   *
   * @param extensionId The id of the extension to show the options page for.
   */
  export function showOptions(extensionId: string): Promise<void>;

  /**
   * Shows the path of the extension specified.
   *
   * @param extensionId The id of the extension to show the path for.
   */
  export function showPath(extensionId: string): Promise<void>;

  /**
   * Updates an extension command.
   *
   * @param update The parameters for updating the extension command.
   */
  export function updateExtensionCommand(update: ExtensionCommandUpdate): Promise<void>;

  /**
   * Modifies an extension's current configuration.
   *
   * @param update The parameters for updating the extension's configuration.
   *     Any properties omitted from |update| will not be changed.
   */
  export function updateExtensionConfiguration(update: ExtensionConfigurationUpdate): Promise<void>;

  /**
   * Updates the active profile.
   * @param update The parameters for updating the profile's configuration.  Any
   *     properties omitted from |update| will not be changed.
   */
  export function updateProfileConfiguration(update: ProfileConfigurationUpdate): Promise<void>;

  /**
   * Returns the user specified site settings (which origins can extensions
   * always/never run on) for the current profile.
   */
  export function getUserSiteSettings(): Promise<UserSiteSettings>;

  /**
   * Adds hosts to the set of user permitted or restricted sites. If any hosts
   * are in the other set than what's specified in `options`, then they are
   * removed from that set.
   */
  export function addUserSpecifiedSites(options: UserSiteSettingsOptions): Promise<void>;

  /**
   * Removes hosts from the specified set of user permitted or restricted
   * sites.
   */
  export function removeUserSpecifiedSites(options: UserSiteSettingsOptions): Promise<void>;

  /**
   * Returns all hosts specified by user site settings, grouped by each host's
   * eTLD+1.
   */
  export function getUserAndExtensionSitesByEtld(): Promise<SiteGroup[]>;

  /**
   * Returns a list of extensions which have at least one matching site in
   * common between its set of host permissions and `site`.
   */
  export function getMatchingExtensionsForSite(site: string): Promise<MatchingExtensionInfo[]>;

  /**
   * Updates the site access settings for multiple extensions for the given
   * `site` and calls `callback` once all updates have been finished.
   * Each update species an extension id an a new HostAccess setting.
   */
  export function updateSiteAccess(site: string, updates: ExtensionSiteAccessUpdate[]): Promise<void>;

  /**
   * Fired when a item state is changed.
   */
  export const onItemStateChanged: ChromeEvent<(data: EventData) => void>;

  /**
   * Fired when the profile's state has changed.
   */
  export const onProfileStateChanged: ChromeEvent<(info: ProfileInfo) => void>;

  /**
   * Fired when the lists of sites in the user's site settings have changed.
   */
  export const onUserSiteSettingsChanged: ChromeEvent<(settings: UserSiteSettings) => void>;
}
